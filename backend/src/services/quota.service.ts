import { query, transaction } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import AIUsageService, { AIUsage } from '../models/AIUsage.model';

export interface QuotaUsage {
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  lastReset: Date;
  nextReset: Date;
  dailyUsage?: number;
  monthlyUsage?: number;
}

export interface QuotaCost {
  evaluation: number;      // AI recitation evaluation
  transcription: number;  // Audio transcription
  pronunciation: number;  // Pronunciation feedback
  tajweed: number;       // Tajweed analysis
  recommendations: number; // Practice recommendations
}

export interface QuotaCheckResult {
  allowed: boolean;
  remainingQuota: number;
  cost: number;
  quotaType: string;
  resetIn?: string;
}

export class QuotaManagementService {
  private readonly QUOTA_COSTS: QuotaCost = {
    evaluation: 5,        // 5 credits for full recitation evaluation
    transcription: 2,    // 2 credits for audio transcription
    pronunciation: 3,     // 3 credits for pronunciation feedback
    tajweed: 4,         // 4 credits for Tajweed analysis
    recommendations: 1   // 1 credit for practice recommendations
  };

  private readonly DEFAULT_QUOTA_LIMITS = {
    free: 100,        // 100 credits per month for free users
    basic: 500,       // 500 credits per month for basic users
    premium: 2000,    // 2000 credits per month for premium users
    unlimited: 999999 // Unlimited for admin/special users
  };

  /**
   * Get user's current quota status
   */
  async getUserQuotaStatus(userId: string): Promise<QuotaUsage> {
    try {
      // Get user subscription info
      const users = await query(
        'SELECT subscription_type FROM users WHERE id = $1',
        [userId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const userSubscription = users[0].subscription_type || 'free';

      // Get or create quota record
      let quotaRecords = await query(
        'SELECT * FROM quota_pool WHERE user_id = $1',
        [userId]
      );

      let quota;
      if (quotaRecords.length === 0) {
        // Create new quota record
        const totalQuota = this.getQuotaLimit(userSubscription);
        await query(
          `INSERT INTO quota_pool (
            id, user_id, total_quota, used_quota, last_reset, last_updated
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [uuidv4(), userId, totalQuota, 0]
        );
        
        quota = {
          total_quota: totalQuota,
          used_quota: 0,
          last_reset: new Date()
        };
      } else {
        quota = quotaRecords[0];
      }

      // Check if quota needs monthly reset
      const lastReset = new Date(quota.last_reset);
      const now = new Date();
      const nextReset = this.calculateNextReset(lastReset);

      if (now >= nextReset) {
        await this.resetUserQuota(userId);
        quota.used_quota = 0;
        quota.last_reset = now;
      }

      const totalQuota = this.getQuotaLimit(userSubscription);
      const usedQuota = quota.used_quota;
      const remainingQuota = Math.max(0, totalQuota - usedQuota);

      // Get usage statistics
      const [dailyUsage, monthlyUsage] = await Promise.all([
        this.getDailyUsage(userId),
        this.getMonthlyUsage(userId)
      ]);

      return {
        totalQuota,
        usedQuota,
        remainingQuota,
        lastReset: quota.last_reset,
        nextReset,
        dailyUsage,
        monthlyUsage
      };
    } catch (error) {
      console.error('Error getting user quota status:', error);
      throw new Error('Failed to retrieve quota status');
    }
  }

  /**
   * Check if user has sufficient quota for AI operation
   */
  async checkQuotaAvailability(
    userId: string, 
    operation: keyof QuotaCost
  ): Promise<QuotaCheckResult> {
    try {
      const quotaStatus = await this.getUserQuotaStatus(userId);
      const cost = this.QUOTA_COSTS[operation];

      if (quotaStatus.remainingQuota >= cost) {
        return {
          allowed: true,
          remainingQuota: quotaStatus.remainingQuota,
          cost,
          quotaType: operation,
          resetIn: this.getTimeUntilReset(quotaStatus.nextReset)
        };
      }

      return {
        allowed: false,
        remainingQuota: quotaStatus.remainingQuota,
        cost,
        quotaType: operation,
        resetIn: this.getTimeUntilReset(quotaStatus.nextReset)
      };
    } catch (error) {
      console.error('Error checking quota availability:', error);
      throw new Error('Failed to check quota availability');
    }
  }

  /**
   * Consume quota for AI operation
   */
  async consumeQuota(
    userId: string,
    operation: keyof QuotaCost,
    metadata?: {
      surahId?: number;
      ayahNumber?: number;
      sessionId?: string;
      duration?: number;
      success: boolean;
    }
  ): Promise<{
    success: boolean;
    remainingQuota: number;
    consumptionId: string;
  }> {
    try {
      const quotaCheck = await this.checkQuotaAvailability(userId, operation);
      
      if (!quotaCheck.allowed) {
        throw new Error(`Insufficient quota. Required: ${quotaCheck.cost}, Available: ${quotaCheck.remainingQuota}`);
      }

      // Start transaction for quota consumption
      return await transaction(async (client) => {
        // Get current quota
        const currentQuota = await client.query(
          'SELECT used_quota FROM quota_pool WHERE user_id = $1',
          [userId]
        );

        if (currentQuota.rows.length === 0) {
          throw new Error('Quota record not found');
        }

        const quotaBefore = currentQuota.rows[0].used_quota;
        const newUsedQuota = quotaBefore + quotaCheck.cost;

        // Update quota
        await client.query(
          `UPDATE quota_pool 
           SET used_quota = $1, last_updated = NOW() 
           WHERE user_id = $2`,
          [newUsedQuota, userId]
        );

        // Log AI usage
        const consumptionId = uuidv4();
        await AIUsageService.createUsage({
          userId,
          operation,
          cost: quotaCheck.cost,
          metadata: metadata || {},
          quotaBefore,
          quotaAfter: newUsedQuota
        });

        // Get updated quota status
        const updatedQuota = await this.getUserQuotaStatus(userId);
        
        return {
          success: true,
          remainingQuota: updatedQuota.remainingQuota,
          consumptionId
        };
      });
    } catch (error) {
      console.error('Error consuming quota:', error);
      throw new Error(`Quota consumption failed: ${error}`);
    }
  }

  /**
   * Refund quota if AI operation fails
   */
  async refundQuota(
    userId: string,
    operation: keyof QuotaCost,
    originalConsumptionId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const cost = this.QUOTA_COSTS[operation];
      
      return await transaction(async (client) => {
        // Get current quota
        const currentQuota = await client.query(
          'SELECT used_quota FROM quota_pool WHERE user_id = $1',
          [userId]
        );

        if (currentQuota.rows.length === 0) {
          throw new Error('Quota record not found for refund');
        }

        const quotaBefore = currentQuota.rows[0].used_quota;
        const newUsedQuota = Math.max(0, quotaBefore - cost);

        // Refund quota
        await client.query(
          `UPDATE quota_pool 
           SET used_quota = $1, last_updated = NOW() 
           WHERE user_id = $2`,
          [newUsedQuota, userId]
        );

        // Log refund
        await AIUsageService.createRefund(userId, operation, cost, reason, originalConsumptionId);

        return true;
      });
    } catch (error) {
      console.error('Error refunding quota:', error);
      return false;
    }
  }

  /**
   * Add quota to user (admin function)
   */
  async addQuota(
    userId: string,
    amount: number,
    reason: string,
    adminId: string
  ): Promise<boolean> {
    try {
      return await transaction(async (client) => {
        // Get current quota limit
        const currentQuota = await client.query(
          'SELECT total_quota FROM quota_pool WHERE user_id = $1',
          [userId]
        );

        const currentLimit = currentQuota.rows[0]?.total_quota || 0;
        const newLimit = currentLimit + amount;

        // Update quota limit
        await client.query(
          `UPDATE quota_pool 
           SET total_quota = $1, last_updated = NOW() 
           WHERE user_id = $2`,
          [newLimit, userId]
        );

        // Log addition
        await AIUsageService.createUsage({
          userId,
          operation: 'quota_addition',
          cost: -amount,
          metadata: {
            reason,
            adminId,
            addition: true
          },
          quotaBefore: currentLimit,
          quotaAfter: newLimit
        });

        return true;
      });
    } catch (error) {
      console.error('Error adding quota:', error);
      return false;
    }
  }

  /**
   * Reset user quota (monthly reset)
   */
  async resetUserQuota(userId: string): Promise<boolean> {
    try {
      const result = await query(
        `UPDATE quota_pool 
         SET used_quota = 0, last_reset = NOW(), last_updated = NOW()
         WHERE user_id = $1`,
        [userId]
      );

      return result.length > 0;
    } catch (error) {
      console.error('Error resetting user quota:', error);
      return false;
    }
  }

  /**
   * Get quota limit based on subscription type
   */
  private getQuotaLimit(subscriptionType: string): number {
    const limit = this.DEFAULT_QUOTA_LIMITS[subscriptionType as keyof typeof this.DEFAULT_QUOTA_LIMITS];
    return limit || this.DEFAULT_QUOTA_LIMITS.free;
  }

  /**
   * Calculate next reset date
   */
  private calculateNextReset(lastReset: Date): Date {
    const nextReset = new Date(lastReset);
    nextReset.setMonth(nextReset.getMonth() + 1);
    return nextReset;
  }

  /**
   * Get time until reset in human readable format
   */
  private getTimeUntilReset(nextReset: Date): string {
    const now = new Date();
    const diff = nextReset.getTime() - now.getTime();
    
    if (diff <= 0) return 'Now';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    return '< 1 hour';
  }

  /**
   * Get daily usage for user
   */
  private async getDailyUsage(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const dailyUsage = await query(
      `SELECT SUM(cost) as total_usage
       FROM ai_usage 
       WHERE user_id = $1 AND timestamp >= $2 AND cost > 0`,
      [userId, startOfDay]
    );

    return parseFloat(dailyUsage[0].total_usage) || 0;
  }

  /**
   * Get monthly usage for user
   */
  private async getMonthlyUsage(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyUsage = await query(
      `SELECT SUM(cost) as total_usage
       FROM ai_usage 
       WHERE user_id = $1 AND timestamp >= $2 AND cost > 0`,
      [userId, startOfMonth]
    );

    return parseFloat(monthlyUsage[0].total_usage) || 0;
  }

  /**
   * Get AI usage analytics for user
   */
  async getUserAIUsageAnalytics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<{
    totalUsage: number;
    operationBreakdown: Record<keyof QuotaCost, number>;
    usageOverTime: Array<{ date: string; usage: number }>;
    trends: {
      averageDaily: number;
      peakUsage: number;
      mostUsedOperation: keyof QuotaCost;
    };
  }> {
    try {
      const analytics = await AIUsageService.getUserAnalytics(userId, period);
      
      // Ensure operation breakdown matches our cost structure
      const operationBreakdown: Record<keyof QuotaCost, number> = {
        evaluation: analytics.operationBreakdown.evaluation || 0,
        transcription: analytics.operationBreakdown.transcription || 0,
        pronunciation: analytics.operationBreakdown.pronunciation || 0,
        tajweed: analytics.operationBreakdown.tajweed || 0,
        recommendations: analytics.operationBreakdown.recommendations || 0
      };

      return {
        totalUsage: analytics.totalUsage,
        operationBreakdown,
        usageOverTime: analytics.usageOverTime,
        trends: {
          averageDaily: analytics.trends.averageDaily,
          peakUsage: analytics.trends.peakUsage,
          mostUsedOperation: analytics.trends.mostUsedOperation as keyof QuotaCost
        }
      };
    } catch (error) {
      console.error('Error getting AI usage analytics:', error);
      throw new Error('Failed to retrieve usage analytics');
    }
  }
}

// Export singleton instance
let quotaService: QuotaManagementService | null = null;

export function getQuotaService(): QuotaManagementService {
  if (!quotaService) {
    quotaService = new QuotaManagementService();
  }
  return quotaService;
}