import { query } from '../config/database';
import { QuotaPool } from '../types';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class QuotaPoolService {
  // Get current quota pool for today
  static async getCurrentQuotaPool(): Promise<QuotaPool | null> {
    try {
      const quotaPools = await query(
        'SELECT * FROM quota_pool WHERE pool_date = CURRENT_DATE'
      );
      return quotaPools.length > 0 ? quotaPools[0] : null;
    } catch (error) {
      throw new Error(`Failed to get current quota pool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create quota pool for a specific date
  static async createQuotaPool(date: Date, freeQuotaDaily: number = 1500): Promise<QuotaPool> {
    try {
      const newQuotaPool = await query(
        `INSERT INTO quota_pool (
          pool_date, free_pool_remaining_calls, total_consumed, 
          per_user_consumption_log, reset_time
        ) VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`,
        [
          date,
          freeQuotaDaily,
          0,
          JSON.stringify({}),
          new Date(),
        ]
      );

      return newQuotaPool[0];
    } catch (error) {
      throw new Error(`Failed to create quota pool: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update quota consumption
  static async updateQuotaConsumption(
    consumed: number, 
    userId?: string,
    details?: any
  ): Promise<QuotaPool> {
    try {
      // Get current quota pool
      let quotaPool = await this.getCurrentQuotaPool();

      // Create one for today if it doesn't exist
      if (!quotaPool) {
        quotaPool = await this.createQuotaPool(new Date());
      }

      // Check if enough quota remains
      if (quotaPool.free_pool_remaining_calls < consumed) {
        throw new BadRequestError('Insufficient quota remaining');
      }

      // Update quota pool
      const updatedQuotaPool = await query(
        `UPDATE quota_pool 
         SET 
           free_pool_remaining_calls = free_pool_remaining_calls - $1,
           total_consumed = total_consumed + $1,
           per_user_consumption_log = CASE 
             WHEN $2 IS NOT NULL THEN 
               per_user_consumption_log::jsonb || jsonb_build_object($2::text, $3)
             ELSE per_user_consumption_log
           END,
           updated_at = NOW()
         WHERE pool_date = CURRENT_DATE
         RETURNING *`,
        [consumed, userId, JSON.stringify({ consumed, timestamp: new Date(), details })]
      );

      return updatedQuotaPool[0];
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new Error(`Failed to update quota consumption: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check if quota is available for consumption
  static async checkQuotaAvailability(requiredQuota: number = 1): Promise<{
    isAvailable: boolean;
    remainingCalls: number;
    dailyLimit: number;
    resetTime: Date;
  }> {
    try {
      let quotaPool = await this.getCurrentQuotaPool();

      // Create one for today if it doesn't exist
      if (!quotaPool) {
        quotaPool = await this.createQuotaPool(new Date());
      }

      const dailyLimit = quotaPool.free_pool_remaining_calls + quotaPool.total_consumed;
      const resetTime = new Date();
      resetTime.setDate(resetTime.getDate() + 1);
      resetTime.setHours(0, 0, 0, 0);

      return {
        isAvailable: quotaPool.free_pool_remaining_calls >= requiredQuota,
        remainingCalls: quotaPool.free_pool_remaining_calls,
        dailyLimit,
        resetTime,
      };
    } catch (error) {
      throw new Error(`Failed to check quota availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user's quota consumption for today
  static async getUserQuotaConsumption(userId: string): Promise<{
    consumed: number;
    lastConsumption: Date | null;
    consumptionDetails: any;
  }> {
    try {
      const quotaPool = await this.getCurrentQuotaPool();
      
      if (!quotaPool || !quotaPool.per_user_consumption_log) {
        return {
          consumed: 0,
          lastConsumption: null,
          consumptionDetails: {},
        };
      }

      const userConsumption = quotaPool.per_user_consumption_log[userId];
      
      if (!userConsumption) {
        return {
          consumed: 0,
          lastConsumption: null,
          consumptionDetails: {},
        };
      }

      // Handle different data structures
      if (Array.isArray(userConsumption)) {
        const total = userConsumption.reduce((sum: number, item: any) => sum + (item.consumed || 1), 0);
        const lastConsumption = userConsumption[userConsumption.length - 1]?.timestamp || null;
        
        return {
          consumed: total,
          lastConsumption: lastConsumption ? new Date(lastConsumption) : null,
          consumptionDetails: { history: userConsumption },
        };
      } else if (typeof userConsumption === 'object') {
        return {
          consumed: userConsumption.consumed || 1,
          lastConsumption: userConsumption.timestamp ? new Date(userConsumption.timestamp) : null,
          consumptionDetails: userConsumption,
        };
      }

      return {
        consumed: 1,
        lastConsumption: null,
        consumptionDetails: userConsumption,
      };
    } catch (error) {
      throw new Error(`Failed to get user quota consumption: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Reset daily quota (admin function)
  static async resetDailyQuota(newLimit?: number): Promise<QuotaPool> {
    try {
      const limit = newLimit || 1500;
      
      const resetQuotaPool = await query(
        `UPDATE quota_pool 
         SET 
           free_pool_remaining_calls = $1,
           total_consumed = 0,
           per_user_consumption_log = '{}',
           reset_time = NOW(),
           updated_at = NOW()
         WHERE pool_date = CURRENT_DATE
         RETURNING *`,
        [limit]
      );

      if (resetQuotaPool.length === 0) {
        // If no pool exists for today, create one
        return await this.createQuotaPool(new Date(), limit);
      }

      return resetQuotaPool[0];
    } catch (error) {
      throw new Error(`Failed to reset daily quota: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get quota pool by date
  static async getQuotaPoolByDate(date: Date): Promise<QuotaPool | null> {
    try {
      const quotaPools = await query(
        'SELECT * FROM quota_pool WHERE pool_date = $1',
        [date]
      );
      return quotaPools.length > 0 ? quotaPools[0] : null;
    } catch (error) {
      throw new Error(`Failed to get quota pool by date: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get quota pool history
  static async getQuotaPoolHistory(options: {
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{ quotaPools: QuotaPool[]; total: number }> {
    try {
      const {
        startDate,
        endDate,
        page = 1,
        limit = 30
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = '';
      const queryParams: any[] = [];

      if (startDate) {
        whereClause += ` WHERE pool_date >= $${queryParams.length + 1}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += whereClause ? ` AND pool_date <= $${queryParams.length + 1}` : ` WHERE pool_date <= $${queryParams.length + 1}`;
        queryParams.push(endDate);
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM quota_pool ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult[0].total);

      // Get quota pools
      const quotaPools = await query(
        `SELECT * FROM quota_pool 
         ${whereClause} 
         ORDER BY pool_date DESC 
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      );

      return { quotaPools, total };
    } catch (error) {
      throw new Error(`Failed to get quota pool history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get quota usage statistics
  static async getQuotaUsageStatistics(options: {
    timeFrame?: 'week' | 'month' | 'quarter' | 'year';
  } = {}): Promise<{
    totalConsumed: number;
    averageDailyConsumption: number;
    peakConsumptionDay: { date: Date; consumed: number } | null;
    usageByUser: Array<{ userId: string; consumed: number; percentage: number }>;
    dailyBreakdown: Array<{ date: Date; consumed: number; remaining: number }>;
  }> {
    try {
      const { timeFrame = 'month' } = options;
      
      let dateFilter = '';
      switch (timeFrame) {
        case 'week':
          dateFilter = 'WHERE pool_date >= CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case 'quarter':
          dateFilter = 'WHERE pool_date >= CURRENT_DATE - INTERVAL \'3 months\'';
          break;
        case 'year':
          dateFilter = 'WHERE pool_date >= CURRENT_DATE - INTERVAL \'1 year\'';
          break;
        default:
          dateFilter = 'WHERE pool_date >= CURRENT_DATE - INTERVAL \'1 month\'';
      }

      const stats = await query(`
        SELECT 
          SUM(total_consumed) as total_consumed,
          ROUND(AVG(total_consumed), 2) as average_daily_consumption
        FROM quota_pool 
        ${dateFilter}
      `);

      // Get peak consumption day
      const peakDay = await query(`
        SELECT pool_date, total_consumed
        FROM quota_pool 
        ${dateFilter}
        ORDER BY total_consumed DESC
        LIMIT 1
      `);

      // Get daily breakdown
      const dailyBreakdown = await query(`
        SELECT pool_date, total_consumed, free_pool_remaining_calls
        FROM quota_pool 
        ${dateFilter}
        ORDER BY pool_date DESC
      `);

      return {
        totalConsumed: parseInt(stats[0].total_consumed) || 0,
        averageDailyConsumption: parseFloat(stats[0].average_daily_consumption) || 0,
        peakConsumptionDay: peakDay.length > 0 ? {
          date: peakDay[0].pool_date,
          consumed: peakDay[0].total_consumed,
        } : null,
        usageByUser: [], // Would need more complex query with user breakdown
        dailyBreakdown: dailyBreakdown.map(day => ({
          date: day.pool_date,
          consumed: day.total_consumed,
          remaining: day.free_pool_remaining_calls,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get quota usage statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add quota manually (admin function)
  static async addQuota(amount: number, reason?: string): Promise<QuotaPool> {
    try {
      const updatedQuotaPool = await query(
        `UPDATE quota_pool 
         SET 
           free_pool_remaining_calls = free_pool_remaining_calls + $1,
           updated_at = NOW()
         WHERE pool_date = CURRENT_DATE
         RETURNING *`,
        [amount]
      );

      if (updatedQuotaPool.length === 0) {
        // If no pool exists for today, create one
        return await this.createQuotaPool(new Date(), amount);
      }

      return updatedQuotaPool[0];
    } catch (error) {
      throw new Error(`Failed to add quota: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Set daily quota limit (admin function)
  static async setDailyQuotaLimit(newLimit: number): Promise<QuotaPool> {
    try {
      const updatedQuotaPool = await query(
        `UPDATE quota_pool 
         SET 
           free_pool_remaining_calls = GREATEST(free_pool_remaining_calls, $1 - total_consumed),
           updated_at = NOW()
         WHERE pool_date = CURRENT_DATE
         RETURNING *`,
        [newLimit]
      );

      if (updatedQuotaPool.length === 0) {
        // If no pool exists for today, create one
        return await this.createQuotaPool(new Date(), newLimit);
      }

      return updatedQuotaPool[0];
    } catch (error) {
      throw new Error(`Failed to set daily quota limit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get quota pool status summary
  static async getQuotaStatusSummary(): Promise<{
    today: {
      totalLimit: number;
      remaining: number;
      consumed: number;
      usagePercentage: number;
    };
    weekly: {
      totalConsumed: number;
      averageDailyConsumption: number;
    };
    monthly: {
      totalConsumed: number;
      averageDailyConsumption: number;
    };
  }> {
    try {
      // Today's status
      const todayQuota = await this.getCurrentQuotaPool();
      const todayTotal = todayQuota ? todayQuota.free_pool_remaining_calls + todayQuota.total_consumed : 1500;
      const todayUsagePercentage = todayQuota ? (todayQuota.total_consumed / todayTotal) * 100 : 0;

      // Weekly statistics
      const weeklyStats = await this.getQuotaUsageStatistics({ timeFrame: 'week' });
      
      // Monthly statistics
      const monthlyStats = await this.getQuotaUsageStatistics({ timeFrame: 'month' });

      return {
        today: {
          totalLimit: todayTotal,
          remaining: todayQuota?.free_pool_remaining_calls || 1500,
          consumed: todayQuota?.total_consumed || 0,
          usagePercentage: Math.round(todayUsagePercentage * 100) / 100,
        },
        weekly: {
          totalConsumed: weeklyStats.totalConsumed,
          averageDailyConsumption: weeklyStats.averageDailyConsumption,
        },
        monthly: {
          totalConsumed: monthlyStats.totalConsumed,
          averageDailyConsumption: monthlyStats.averageDailyConsumption,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get quota status summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default QuotaPoolService;