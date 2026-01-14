import { query, transaction } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface IstighfarSession {
  id: string;
  userId: string;
  durationSeconds: number;
  countedRepetitions: number;
  targetRepetitions: number;
  sessionType: 'personal' | 'guided' | 'challenge';
  startTime: Date;
  endTime?: Date;
  completionRate?: number;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IstighfarSessionCreateInput {
  userId: string;
  durationSeconds?: number;
  countedRepetitions?: number;
  targetRepetitions: number;
  sessionType: IstighfarSession['sessionType'];
  startTime?: Date;
  notes?: string;
}

export interface IstighfarSessionUpdateInput {
  durationSeconds?: number;
  countedRepetitions?: number;
  endTime?: Date;
  completionRate?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

export class IstighfarService {
  /**
   * Create new istighfar session
   */
  static async createSession(sessionData: IstighfarSessionCreateInput): Promise<IstighfarSession> {
    try {
      const newSession = await query<IstighfarSession>(
        `INSERT INTO istighfar_sessions (
          id, user_id, duration_seconds, counted_repetitions, target_repetitions,
          session_type, start_time, completion_rate, notes, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *`,
        [
          uuidv4(),
          sessionData.userId,
          sessionData.durationSeconds || 0,
          sessionData.countedRepetitions || 0,
          sessionData.targetRepetitions,
          sessionData.sessionType,
          sessionData.startTime || new Date(),
          null, // completion_rate will be calculated later
          sessionData.notes,
          JSON.stringify(sessionData.metadata || {})
        ]
      );

      return newSession[0];
    } catch (error: any) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  /**
   * Get session by ID
   */
  static async getSessionById(sessionId: string): Promise<IstighfarSession | null> {
    try {
      const sessions = await query<IstighfarSession>(
        'SELECT * FROM istighfar_sessions WHERE id = $1',
        [sessionId]
      );

      return sessions.length > 0 ? sessions[0] : null;
    } catch (error: any) {
      throw new Error(`Failed to get session by ID: ${error.message}`);
    }
  }

  /**
   * Get sessions for a user
   */
  static async getUserSessions(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      sessionType?: IstighfarSession['sessionType'];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ sessions: IstighfarSession[]; total: number }> {
    try {
      const {
        limit = 50,
        offset = 0,
        sessionType,
        startDate,
        endDate
      } = options;

      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (sessionType) {
        whereClause += ` AND session_type = $${paramIndex++}`;
        params.push(sessionType);
      }

      if (startDate) {
        whereClause += ` AND start_time >= $${paramIndex++}`;
        params.push(startDate);
      }

      if (endDate) {
        whereClause += ` AND start_time <= $${paramIndex++}`;
        params.push(endDate);
      }

      // Get total count
      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM istighfar_sessions ${whereClause}`,
        params
      );
      const total = parseInt(countResult[0].count);

      // Get sessions
      const sessions = await query<IstighfarSession>(
        `SELECT * FROM istighfar_sessions ${whereClause}
         ORDER BY start_time DESC
         LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
        [...params, limit, offset]
      );

      return { sessions, total };
    } catch (error: any) {
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }
  }

  /**
   * Update session
   */
  static async updateSession(
    sessionId: string,
    updateData: IstighfarSessionUpdateInput
  ): Promise<IstighfarSession> {
    try {
      const updateFields: string[] = [];
      const params: any[] = [];

      if (updateData.durationSeconds !== undefined) {
        updateFields.push(`duration_seconds = $${params.length + 1}`);
        params.push(updateData.durationSeconds);
      }

      if (updateData.countedRepetitions !== undefined) {
        updateFields.push(`counted_repetitions = $${params.length + 1}`);
        params.push(updateData.countedRepetitions);
      }

      if (updateData.endTime !== undefined) {
        updateFields.push(`end_time = $${params.length + 1}`);
        params.push(updateData.endTime);
      }

      if (updateData.completionRate !== undefined) {
        updateFields.push(`completion_rate = $${params.length + 1}`);
        params.push(updateData.completionRate);
      }

      if (updateData.notes !== undefined) {
        updateFields.push(`notes = $${params.length + 1}`);
        params.push(updateData.notes);
      }

      if (updateData.metadata !== undefined) {
        updateFields.push(`metadata = $${params.length + 1}`);
        params.push(JSON.stringify(updateData.metadata));
      }

      updateFields.push(`updated_at = NOW()`);
      params.push(sessionId);

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      const updatedSession = await query<IstighfarSession>(
        `UPDATE istighfar_sessions 
         SET ${updateFields.join(', ')}
         WHERE id = $${params.length}
         RETURNING *`,
        params
      );

      if (updatedSession.length === 0) {
        throw new Error('Session not found');
      }

      return updatedSession[0];
    } catch (error: any) {
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  /**
   * Complete session with final duration and repetitions
   */
  static async completeSession(
    sessionId: string,
    finalDuration: number,
    finalRepetitions: number
  ): Promise<IstighfarSession> {
    try {
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const completionRate = Math.min(100, (finalRepetitions / session.targetRepetitions) * 100);

      return await this.updateSession(sessionId, {
        durationSeconds: finalDuration,
        countedRepetitions: finalRepetitions,
        endTime: new Date(),
        completionRate
      });
    } catch (error: any) {
      throw new Error(`Failed to complete session: ${error.message}`);
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics(userId: string): Promise<{
    totalSessions: number;
    totalRepetitions: number;
    averageCompletionRate: number;
    totalDuration: number;
    bestSession: IstighfarSession | null;
    currentStreak: number;
    longestStreak: number;
  }> {
    try {
      const stats = await query<any>(
        `SELECT 
           COUNT(*) as total_sessions,
           SUM(counted_repetitions) as total_repetitions,
           AVG(completion_rate) as avg_completion_rate,
           SUM(duration_seconds) as total_duration
         FROM istighfar_sessions 
         WHERE user_id = $1 AND end_time IS NOT NULL`,
        [userId]
      );

      const bestSession = await query<IstighfarSession>(
        `SELECT * FROM istighfar_sessions 
         WHERE user_id = $1 AND completion_rate IS NOT NULL
         ORDER BY completion_rate DESC LIMIT 1`,
        [userId]
      );

      const totalSessions = parseInt(stats[0].total_sessions) || 0;
      const totalRepetitions = parseInt(stats[0].total_repetitions) || 0;
      const averageCompletionRate = parseFloat(stats[0].avg_completion_rate) || 0;
      const totalDuration = parseInt(stats[0].total_duration) || 0;

      // Calculate streaks
      const { currentStreak, longestStreak } = await this.calculateStreaks(userId);

      return {
        totalSessions,
        totalRepetitions,
        averageCompletionRate,
        totalDuration,
        bestSession: bestSession.length > 0 ? bestSession[0] : null,
        currentStreak,
        longestStreak
      };
    } catch (error: any) {
      throw new Error(`Failed to get user statistics: ${error.message}`);
    }
  }

  /**
   * Get leaderboard data
   */
  static async getLeaderboard(
    type: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time',
    limit: number = 50
  ): Promise<Array<{
    userId: string;
    totalRepetitions: number;
    totalSessions: number;
    averageCompletionRate: number;
    rank: number;
  }>> {
    try {
      let dateFilter = '';
      switch (type) {
        case 'daily':
          dateFilter = 'AND start_time >= CURRENT_DATE';
          break;
        case 'weekly':
          dateFilter = 'AND start_time >= CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case 'monthly':
          dateFilter = 'AND start_time >= CURRENT_DATE - INTERVAL \'30 days\'';
          break;
      }

      const leaderboard = await query<any>(
        `SELECT 
           user_id,
           SUM(counted_repetitions) as total_repetitions,
           COUNT(*) as total_sessions,
           AVG(completion_rate) as avg_completion_rate
         FROM istighfar_sessions 
         WHERE end_time IS NOT NULL ${dateFilter}
         GROUP BY user_id
         HAVING SUM(counted_repetitions) > 0
         ORDER BY total_repetitions DESC, avg_completion_rate DESC
         LIMIT $1`,
        [limit]
      );

      return leaderboard.map((entry, index) => ({
        userId: entry.user_id,
        totalRepetitions: parseInt(entry.total_repetitions),
        totalSessions: parseInt(entry.total_sessions),
        averageCompletionRate: parseFloat(entry.avg_completion_rate),
        rank: index + 1
      }));
    } catch (error: any) {
      throw new Error(`Failed to get leaderboard: ${error.message}`);
    }
  }

  /**
   * Get user rank position
   */
  static async getUserRank(
    userId: string,
    type: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time'
  ): Promise<{
    rank: number;
    totalUsers: number;
    userStats: {
      totalRepetitions: number;
      totalSessions: number;
      averageCompletionRate: number;
    };
  }> {
    try {
      let dateFilter = '';
      switch (type) {
        case 'daily':
          dateFilter = 'AND start_time >= CURRENT_DATE';
          break;
        case 'weekly':
          dateFilter = 'AND start_time >= CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case 'monthly':
          dateFilter = 'AND start_time >= CURRENT_DATE - INTERVAL \'30 days\'';
          break;
      }

      // Get user statistics
      const userStats = await query<any>(
        `SELECT 
           SUM(counted_repetitions) as total_repetitions,
           COUNT(*) as total_sessions,
           AVG(completion_rate) as avg_completion_rate
         FROM istighfar_sessions 
         WHERE user_id = $1 AND end_time IS NOT NULL ${dateFilter}`,
        [userId]
      );

      if (userStats.length === 0 || !userStats[0].total_repetitions) {
        return {
          rank: 0,
          totalUsers: 0,
          userStats: {
            totalRepetitions: 0,
            totalSessions: 0,
            averageCompletionRate: 0
          }
        };
      }

      // Get rank
      const rankResult = await query<any>(
        `SELECT COUNT(*) as rank_count
         FROM (
           SELECT user_id
           FROM istighfar_sessions 
           WHERE end_time IS NOT NULL ${dateFilter}
           GROUP BY user_id
           HAVING SUM(counted_repetitions) > $1
         ) AS better_users`,
        [userStats[0].total_repetitions]
      );

      const rank = parseInt(rankResult[0].rank_count) + 1;

      // Get total users
      const totalUsersResult = await query<any>(
        `SELECT COUNT(DISTINCT user_id) as total_users
         FROM istighfar_sessions 
         WHERE end_time IS NOT NULL ${dateFilter}`,
        []
      );

      const totalUsers = parseInt(totalUsersResult[0].total_users);

      return {
        rank,
        totalUsers,
        userStats: {
          totalRepetitions: parseInt(userStats[0].total_repetitions),
          totalSessions: parseInt(userStats[0].total_sessions),
          averageCompletionRate: parseFloat(userStats[0].avg_completion_rate)
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get user rank: ${error.message}`);
    }
  }

  /**
   * Delete session
   */
  static async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const result = await query(
        'DELETE FROM istighfar_sessions WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
      );

      return result.length > 0;
    } catch (error: any) {
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  /**
   * Calculate streaks for user
   */
  private static async calculateStreaks(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
  }> {
    try {
      const sessions = await query<any>(
        `SELECT DATE(start_time) as session_date
         FROM istighfar_sessions 
         WHERE user_id = $1 AND end_time IS NOT NULL
         ORDER BY session_date DESC`,
        [userId]
      );

      if (sessions.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
      }

      const uniqueDates = [...new Set(sessions.map(s => s.session_date.toString()))];
      const sortedDates = uniqueDates.sort().reverse();
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < sortedDates.length; i++) {
        const sessionDate = new Date(sortedDates[i]);
        sessionDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === i) {
          tempStreak++;
          if (i === 0) currentStreak = tempStreak;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);

      return { currentStreak, longestStreak };
    } catch (error: any) {
      console.error('Error calculating streaks:', error);
      return { currentStreak: 0, longestStreak: 0 };
    }
  }
}

export default IstighfarService;