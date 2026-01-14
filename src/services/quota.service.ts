import Quota from '../models/Quota.model';
import User from '../models/User.model';
import AIUsage from '../models/AIUsage.model';
import mongoose from 'mongoose';

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
      const [user, quota, todayUsage, monthUsage] = await Promise.all([
        User.findById(userId).select('subscriptionType'),
        Quota.findOne({ userId }),
        this.getDailyUsage(userId),
        this.getMonthlyUsage(userId)
      ]);

      if (!user || !quota) {
        throw new Error('User or quota not found');
      }

      const totalQuota = this.getQuotaLimit(user.subscriptionType);
      const usedQuota = quota.usedQuota;
      const remainingQuota = Math.max(0, totalQuota - usedQuota);

      return {
        totalQuota,
        usedQuota,
        remainingQuota,
        lastReset: quota.lastReset,
        nextReset: this.calculateNextReset(quota.lastReset),
        dailyUsage: todayUsage,
        monthlyUsage: monthUsage
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
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Update quota
          const quota = await Quota.findOneAndUpdate(
            { userId },
            { 
              $inc: { usedQuota: quotaCheck.cost },
              $set: { lastUpdated: new Date() }
            },
            { session, new: true }
          );

          if (!quota) {
            throw new Error('Quota record not found');
          }

          // Log AI usage
          const usage = new AIUsage({
            userId,
            operation,
            cost: quotaCheck.cost,
            metadata: metadata || {},
            timestamp: new Date(),
            quotaBefore: quota.usedQuota - quotaCheck.cost,
            quotaAfter: quota.usedQuota
          });

          await usage.save({ session });

          // Update daily/monthly usage stats
          await this.updateUsageStats(userId, operation, quotaCheck.cost, { session });
        });

        const updatedQuota = await this.getUserQuotaStatus(userId);
        
        return {
          success: true,
          remainingQuota: updatedQuota.remainingQuota,
          consumptionId: `usage_${Date.now()}_${userId}`
        };
      } finally {
        await session.endSession();
      }
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
      
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Refund quota
          const quota = await Quota.findOneAndUpdate(
            { userId },
            { 
              $inc: { usedQuota: -cost },
              $set: { lastUpdated: new Date() }
            },
            { session, new: true }
          );

          if (!quota) {
            throw new Error('Quota record not found for refund');
          }

          // Log refund
          const usage = new AIUsage({
            userId,
            operation,
            cost: -cost,
            metadata: {
              refund: true,
              originalConsumptionId,
              reason
            },
            timestamp: new Date(),
            quotaBefore: quota.usedQuota + cost,
            quotaAfter: quota.usedQuota
          });

          await usage.save({ session });
        });

        return true;
      } finally {
        await session.endSession();
      }
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
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Update quota limit
          const quota = await Quota.findOneAndUpdate(
            { userId },
            { 
              $inc: { quotaLimit: amount },
              $set: { lastUpdated: new Date() }
            },
            { session, new: true, upsert: true }
          );

          // Log addition
          const usage = new AIUsage({
            userId,
            operation: 'quota_addition',
            cost: -amount,
            metadata: {
              reason,
              adminId,
              addition: true
            },
            timestamp: new Date(),
            quotaBefore: quota.quotaLimit - amount,
            quotaAfter: quota.quotaLimit
          });

          await usage.save({ session });
        });

        return true;
      } finally {
        await session.endSession();
      }
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
      const result = await Quota.updateOne(
        { userId },
        { 
          $set: { 
            usedQuota: 0, 
            lastReset: new Date(),
            lastUpdated: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
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
    
    const dailyUsage = await AIUsage.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startOfDay },
          cost: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$cost' }
        }
      }
    ]);

    return dailyUsage[0]?.total || 0;
  }

  /**
   * Get monthly usage for user
   */
  private async getMonthlyUsage(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyUsage = await AIUsage.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startOfMonth },
          cost: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$cost' }
        }
      }
    ]);

    return monthlyUsage[0]?.total || 0;
  }

  /**
   * Update usage statistics
   */
  private async updateUsageStats(
    userId: string,
    operation: keyof QuotaCost,
    cost: number,
    options: { session?: any } = {}
  ): Promise<void> {
    // This could be extended to update daily/monthly stats collections
    // For now, we rely on the AIUsage collection for analytics
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
      const startDate = this.getStartDateForPeriod(period);
      
      const usageData = await AIUsage.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate },
            cost: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              operation: '$operation'
            },
            totalCost: { $sum: '$cost' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            operations: {
              $push: {
                operation: '$_id.operation',
                cost: '$totalCost',
                count: '$count'
              }
            },
            dailyTotal: { $sum: '$totalCost' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Calculate operation breakdown
      const operationBreakdown = Object.keys(this.QUOTA_COSTS).reduce((acc, op) => {
        acc[op as keyof QuotaCost] = 0;
        return acc;
      }, {} as Record<keyof QuotaCost, number>);

      let totalUsage = 0;
      let peakUsage = 0;

      usageData.forEach(day => {
        totalUsage += day.dailyTotal;
        peakUsage = Math.max(peakUsage, day.dailyTotal);
        
        day.operations.forEach(op => {
          if (op.operation in operationBreakdown) {
            operationBreakdown[op.operation as keyof QuotaCost] += op.cost;
          }
        });
      });

      const usageOverTime = usageData.map(day => ({
        date: day._id,
        usage: day.dailyTotal
      }));

      const averageDaily = usageData.length > 0 ? totalUsage / usageData.length : 0;
      const mostUsedOperation = (Object.entries(operationBreakdown)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'evaluation') as keyof QuotaCost;

      return {
        totalUsage,
        operationBreakdown,
        usageOverTime,
        trends: {
          averageDaily,
          peakUsage,
          mostUsedOperation
        }
      };
    } catch (error) {
      console.error('Error getting AI usage analytics:', error);
      throw new Error('Failed to retrieve usage analytics');
    }
  }

  /**
   * Get start date for given period
   */
  private getStartDateForPeriod(period: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    switch (period) {
      case 'daily':
        now.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        now.setDate(now.getDate() - now.getDay());
        now.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        now.setDate(1);
        now.setHours(0, 0, 0, 0);
        break;
    }
    return now;
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