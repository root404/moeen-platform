import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface AIUsage {
  id: string;
  userId: string;
  operation: 'evaluation' | 'transcription' | 'pronunciation' | 'tajweed' | 'recommendations' | 'quota_addition';
  cost: number;
  metadata?: {
    surahId?: number;
    ayahNumber?: number;
    sessionId?: string;
    duration?: number;
    success?: boolean;
    refund?: boolean;
    originalConsumptionId?: string;
    reason?: string;
    adminId?: string;
    addition?: boolean;
  };
  timestamp: Date;
  quotaBefore: number;
  quotaAfter: number;
}

export interface AIUsageCreateInput {
  userId: string;
  operation: AIUsage['operation'];
  cost: number;
  metadata?: AIUsage['metadata'];
  quotaBefore: number;
  quotaAfter: number;
}

export class AIUsageService {
  /**
   * Create a new AI usage record
   */
  static async createUsage(usageData: AIUsageCreateInput): Promise<AIUsage> {
    try {
      const newUsage = await query<AIUsage>(
        `INSERT INTO ai_usage (
          id, user_id, operation, cost, metadata, timestamp, quota_before, quota_after
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
        RETURNING *`,
        [
          uuidv4(),
          usageData.userId,
          usageData.operation,
          usageData.cost,
          JSON.stringify(usageData.metadata || {}),
          usageData.quotaBefore,
          usageData.quotaAfter
        ]
      );

      return newUsage[0];
    } catch (error: any) {
      throw new Error(`Failed to create AI usage record: ${error.message}`);
    }
  }

  /**
   * Get usage records for a user
   */
  static async getUserUsage(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      operation?: AIUsage['operation'];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ usages: AIUsage[]; total: number }> {
    try {
      const {
        limit = 50,
        offset = 0,
        operation,
        startDate,
        endDate
      } = options;

      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (operation) {
        whereClause += ` AND operation = $${paramIndex++}`;
        params.push(operation);
      }

      if (startDate) {
        whereClause += ` AND timestamp >= $${paramIndex++}`;
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ` AND timestamp <= $${paramIndex++}`;
        params.push(endDate);
      }

      // Get total count
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ai_usage ${whereClause}`,
        params
      );
      const total = parseInt(countResult[0].count);

      // Get records
      const usages = await query<AIUsage>(
        `SELECT * FROM ai_usage ${whereClause}
         ORDER BY timestamp DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, limit, offset]
      );

      return { usages, total };
    } catch (error: any) {
      throw new Error(`Failed to get user usage: ${error.message}`);
    }
  }

  /**
   * Get usage analytics for a user
   */
  static async getUserAnalytics(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<{
    totalUsage: number;
    operationBreakdown: Record<string, number>;
    usageOverTime: Array<{ date: string; usage: number }>;
    trends: {
      averageDaily: number;
      peakUsage: number;
      mostUsedOperation: string;
    };
  }> {
    try {
      const startDate = this.getStartDateForPeriod(period);
      
      const usageData = await query(
        `SELECT 
           DATE(timestamp) as date,
           operation,
           SUM(cost) as total_cost,
           COUNT(*) as count
         FROM ai_usage 
         WHERE user_id = $1 AND timestamp >= $2 AND cost > 0
         GROUP BY DATE(timestamp), operation
         ORDER BY date, operation`,
        [userId, startDate]
      );

      // Calculate operation breakdown
      const operationBreakdown: Record<string, number> = {};
      const dailyUsage: Record<string, number> = {};
      let totalUsage = 0;
      let peakUsage = 0;

      usageData.forEach(item => {
        const date = item.date.toISOString().split('T')[0];
        const operation = item.operation;
        const cost = parseFloat(item.total_cost);

        // Update operation breakdown
        operationBreakdown[operation] = (operationBreakdown[operation] || 0) + cost;

        // Update daily usage
        dailyUsage[date] = (dailyUsage[date] || 0) + cost;
        totalUsage += cost;
        peakUsage = Math.max(peakUsage, dailyUsage[date]);
      });

      // Create usage over time array
      const usageOverTime = Object.entries(dailyUsage)
        .map(([date, usage]) => ({ date, usage }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate trends
      const averageDaily = Object.keys(dailyUsage).length > 0 ? 
        totalUsage / Object.keys(dailyUsage).length : 0;
      
      const mostUsedOperation = Object.entries(operationBreakdown)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'evaluation';

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
    } catch (error: any) {
      throw new Error(`Failed to get user analytics: ${error.message}`);
    }
  }

  /**
   * Get usage statistics for admin
   */
  static async getAdminStats(
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<{
    totalUsage: number;
    totalUsers: number;
    operationBreakdown: Record<string, number>;
    usageOverTime: Array<{ date: string; usage: number; users: number }>;
    topUsers: Array<{ userId: string; totalUsage: number; usageCount: number }>;
  }> {
    try {
      const startDate = this.getStartDateForPeriod(period);
      
      // Get overall stats
      const overallStats = await query(
        `SELECT 
           COUNT(DISTINCT user_id) as total_users,
           SUM(cost) as total_usage,
           COUNT(*) as total_operations
         FROM ai_usage 
         WHERE timestamp >= $2 AND cost > 0`,
        [startDate]
      );

      const totalUsage = parseFloat(overallStats[0].total_usage) || 0;
      const totalUsers = parseInt(overallStats[0].total_users) || 0;

      // Get operation breakdown
      const operationStats = await query(
        `SELECT operation, SUM(cost) as total_cost
         FROM ai_usage 
         WHERE timestamp >= $1 AND cost > 0
         GROUP BY operation
         ORDER BY total_cost DESC`,
        [startDate]
      );

      const operationBreakdown = operationStats.reduce((acc: Record<string, number>, item) => {
        acc[item.operation] = parseFloat(item.total_cost);
        return acc;
      }, {});

      // Get usage over time
      const timeStats = await query(
        `SELECT 
           DATE(timestamp) as date,
           SUM(cost) as total_cost,
           COUNT(DISTINCT user_id) as unique_users
         FROM ai_usage 
         WHERE timestamp >= $1 AND cost > 0
         GROUP BY DATE(timestamp)
         ORDER BY date`,
        [startDate]
      );

      const usageOverTime = timeStats.map(item => ({
        date: item.date.toISOString().split('T')[0],
        usage: parseFloat(item.total_cost),
        users: parseInt(item.unique_users)
      }));

      // Get top users
      const topUsersStats = await query(
        `SELECT 
           user_id,
           SUM(cost) as total_cost,
           COUNT(*) as usage_count
         FROM ai_usage 
         WHERE timestamp >= $1 AND cost > 0
         GROUP BY user_id
         ORDER BY total_cost DESC
         LIMIT 10`,
        [startDate]
      );

      const topUsers = topUsersStats.map(item => ({
        userId: item.user_id,
        totalUsage: parseFloat(item.total_cost),
        usageCount: parseInt(item.usage_count)
      }));

      return {
        totalUsage,
        totalUsers,
        operationBreakdown,
        usageOverTime,
        topUsers
      };
    } catch (error: any) {
      throw new Error(`Failed to get admin stats: ${error.message}`);
    }
  }

  /**
   * Refund quota (create negative usage record)
   */
  static async createRefund(
    userId: string,
    operation: AIUsage['operation'],
    amount: number,
    reason: string,
    originalConsumptionId?: string
  ): Promise<AIUsage> {
    try {
      return await this.createUsage({
        userId,
        operation,
        cost: -Math.abs(amount),
        metadata: {
          refund: true,
          originalConsumptionId,
          reason
        },
        quotaBefore: 0, // These will be updated by the calling service
        quotaAfter: 0
      });
    } catch (error: any) {
      throw new Error(`Failed to create refund record: ${error.message}`);
    }
  }

  /**
   * Delete old usage records (cleanup)
   */
  static async cleanupOldRecords(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await query<{ count: string }>(
        `DELETE FROM ai_usage WHERE timestamp < $1 RETURNING COUNT(*) as count`,
        [cutoffDate]
      );

      return parseInt(result[0].count);
    } catch (error: any) {
      throw new Error(`Failed to cleanup old records: ${error.message}`);
    }
  }

  /**
   * Get start date for given period
   */
  private static getStartDateForPeriod(period: 'daily' | 'weekly' | 'monthly'): Date {
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

// Export types and service
export default AIUsageService;