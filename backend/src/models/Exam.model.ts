import { query } from '../config/database';
import { Exam, ExamCreateInput, ExamUpdateInput } from '../types';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class ExamService {
  // Create a new exam
  static async createExam(examData: ExamCreateInput): Promise<Exam> {
    try {
      const newExam = await query(
        `INSERT INTO exams (
          user_id, surah_id, exam_type, ai_evaluation_json, 
          score, max_score, status, started_at, finished_at, 
          duration_seconds, attempts_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *`,
        [
          examData.user_id,
          examData.surah_id,
          examData.exam_type,
          examData.ai_evaluation_json ? JSON.stringify(examData.ai_evaluation_json) : null,
          examData.score || null,
          examData.max_score || 100,
          examData.status || 'pending',
          examData.started_at || null,
          examData.finished_at || null,
          examData.duration_seconds || null,
          examData.attempts_count || 0,
        ]
      );

      return newExam[0];
    } catch (error) {
      throw new Error(`Failed to create exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get exam by ID
  static async getExamById(examId: string): Promise<Exam | null> {
    try {
      const exams = await query(
        'SELECT * FROM exams WHERE id = $1',
        [examId]
      );
      return exams.length > 0 ? exams[0] : null;
    } catch (error) {
      throw new Error(`Failed to get exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get exams by user ID
  static async getExamsByUserId(
    userId: string, 
    options: {
      page?: number;
      limit?: number;
      examType?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ exams: Exam[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        examType,
        status,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE user_id = $1';
      const queryParams: any[] = [userId];

      // Add filters
      if (examType) {
        whereClause += ` AND exam_type = $${queryParams.length + 1}`;
        queryParams.push(examType);
      }

      if (status) {
        whereClause += ` AND status = $${queryParams.length + 1}`;
        queryParams.push(status);
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM exams ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult[0].total);

      // Get exams
      const exams = await query(
        `SELECT * FROM exams 
         ${whereClause} 
         ORDER BY ${sortBy} ${sortOrder} 
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      );

      return { exams, total };
    } catch (error) {
      throw new Error(`Failed to get exams by user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update exam
  static async updateExam(examId: string, updateData: ExamUpdateInput): Promise<Exam> {
    try {
      // Check if exam exists
      const existingExam = await this.getExamById(examId);
      if (!existingExam) {
        throw new NotFoundError('Exam');
      }

      // Build dynamic update query
      const updateFields = Object.keys(updateData)
        .filter(key => updateData[key as keyof ExamUpdateInput] !== undefined)
        .map((key, index) => {
          if (key === 'ai_evaluation_json') {
            return `${key} = $${index + 2}::jsonb`;
          }
          return `${key} = $${index + 2}`;
        })
        .join(', ');

      const updateValues = Object.values(updateData).filter(value => value !== undefined);

      if (updateFields.length === 0) {
        return existingExam; // No updates to make
      }

      const updatedExam = await query(
        `UPDATE exams SET ${updateFields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [examId, ...updateValues]
      );

      return updatedExam[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to update exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Start exam
  static async startExam(examId: string): Promise<Exam> {
    try {
      const updatedExam = await query(
        `UPDATE exams 
         SET status = 'in_progress', started_at = NOW(), updated_at = NOW() 
         WHERE id = $1 AND status = 'pending' 
         RETURNING *`,
        [examId]
      );

      if (updatedExam.length === 0) {
        throw new BadRequestError('Exam cannot be started. It may already be started or completed.');
      }

      return updatedExam[0];
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to start exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Complete exam
  static async completeExam(
    examId: string, 
    score: number, 
    aiEvaluation: any
  ): Promise<Exam> {
    try {
      const updatedExam = await query(
        `UPDATE exams 
         SET 
           status = CASE 
             WHEN $2 >= 90 THEN 'completed'
             ELSE 'failed'
           END,
           score = $2,
           ai_evaluation_json = $3::jsonb,
           finished_at = NOW(),
           duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
           updated_at = NOW()
         WHERE id = $1 AND status = 'in_progress'
         RETURNING *`,
        [examId, score, JSON.stringify(aiEvaluation)]
      );

      if (updatedExam.length === 0) {
        throw new BadRequestError('Exam cannot be completed. It may not be in progress.');
      }

      return updatedExam[0];
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to complete exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cancel exam
  static async cancelExam(examId: string, reason?: string): Promise<Exam> {
    try {
      const updatedExam = await query(
        `UPDATE exams 
         SET status = 'cancelled', finished_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND status IN ('pending', 'in_progress')
         RETURNING *`,
        [examId]
      );

      if (updatedExam.length === 0) {
        throw new BadRequestError('Exam cannot be cancelled. It may already be completed.');
      }

      return updatedExam[0];
    } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to cancel exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Increment exam attempts
  static async incrementAttempts(examId: string): Promise<Exam> {
    try {
      const updatedExam = await query(
        `UPDATE exams 
         SET attempts_count = attempts_count + 1, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [examId]
      );

      return updatedExam[0];
    } catch (error) {
      throw new Error(`Failed to increment attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get exams by surah
  static async getExamsBySurah(
    surahId: number, 
    options: {
      page?: number;
      limit?: number;
      examType?: string;
      status?: string;
    } = {}
  ): Promise<{ exams: Exam[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        examType,
        status
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE surah_id = $1';
      const queryParams: any[] = [surahId];

      if (examType) {
        whereClause += ` AND exam_type = $${queryParams.length + 1}`;
        queryParams.push(examType);
      }

      if (status) {
        whereClause += ` AND status = $${queryParams.length + 1}`;
        queryParams.push(status);
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM exams ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult[0].total);

      // Get exams
      const exams = await query(
        `SELECT * FROM exams 
         ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, limit, offset]
      );

      return { exams, total };
    } catch (error) {
      throw new Error(`Failed to get exams by surah: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get exam statistics for a user
  static async getUserExamStatistics(userId: string): Promise<{
    totalExams: number;
    completedExams: number;
    failedExams: number;
    averageScore: number;
    highestScore: number;
    totalDuration: number;
    averageDuration: number;
    favoriteSurah: number | null;
    examTypes: Record<string, number>;
  }> {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total_exams,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_exams,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_exams,
          ROUND(AVG(CASE WHEN score IS NOT NULL THEN score END), 2) as average_score,
          MAX(CASE WHEN score IS NOT NULL THEN score END) as highest_score,
          SUM(CASE WHEN duration_seconds IS NOT NULL THEN duration_seconds END) as total_duration,
          ROUND(AVG(CASE WHEN duration_seconds IS NOT NULL THEN duration_seconds END), 2) as average_duration
        FROM exams 
        WHERE user_id = $1
      `, [userId]);

      // Get favorite surah
      const favoriteSurah = await query(`
        SELECT surah_id, COUNT(*) as count
        FROM exams 
        WHERE user_id = $1 AND status = 'completed'
        GROUP BY surah_id
        ORDER BY count DESC
        LIMIT 1
      `, [userId]);

      // Get exam types distribution
      const examTypes = await query(`
        SELECT exam_type, COUNT(*) as count
        FROM exams 
        WHERE user_id = $1
        GROUP BY exam_type
      `, [userId]);

      const examTypeCounts: Record<string, number> = {};
      examTypes.forEach(type => {
        examTypeCounts[type.exam_type] = parseInt(type.count);
      });

      return {
        totalExams: parseInt(stats[0].total_exams),
        completedExams: parseInt(stats[0].completed_exams),
        failedExams: parseInt(stats[0].failed_exams),
        averageScore: parseFloat(stats[0].average_score) || 0,
        highestScore: parseInt(stats[0].highest_score) || 0,
        totalDuration: parseInt(stats[0].total_duration) || 0,
        averageDuration: parseFloat(stats[0].average_duration) || 0,
        favoriteSurah: favoriteSurah.length > 0 ? favoriteSurah[0].surah_id : null,
        examTypes: examTypeCounts,
      };
    } catch (error) {
      throw new Error(`Failed to get user exam statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete exam
  static async deleteExam(examId: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM exams WHERE id = $1', [examId]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get recent exams across all users (admin function)
  static async getRecentExams(limit: number = 50): Promise<Exam[]> {
    try {
      const exams = await query(
        `SELECT e.*, u.email as user_email
         FROM exams e
         JOIN users u ON e.user_id = u.id
         ORDER BY e.created_at DESC
         LIMIT $1`,
        [limit]
      );
      return exams;
    } catch (error) {
      throw new Error(`Failed to get recent exams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get exam performance metrics (admin function)
  static async getExamPerformanceMetrics(): Promise<{
    totalExams: number;
    completionRate: number;
    averageScore: number;
    averageDuration: number;
    examTypes: Record<string, number>;
    monthlyTrends: Array<{ month: string; exams: number; averageScore: number }>;
  }> {
    try {
      const metrics = await query(`
        SELECT 
          COUNT(*) as total_exams,
          COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / COUNT(*) * 100 as completion_rate,
          ROUND(AVG(CASE WHEN score IS NOT NULL THEN score END), 2) as average_score,
          ROUND(AVG(CASE WHEN duration_seconds IS NOT NULL THEN duration_seconds END), 2) as average_duration
        FROM exams
      `);

      const examTypes = await query(`
        SELECT exam_type, COUNT(*) as count
        FROM exams
        GROUP BY exam_type
      `);

      const monthlyTrends = await query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*) as exams,
          ROUND(AVG(CASE WHEN score IS NOT NULL THEN score END), 2) as average_score
        FROM exams
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
      `);

      const examTypeCounts: Record<string, number> = {};
      examTypes.forEach(type => {
        examTypeCounts[type.exam_type] = parseInt(type.count);
      });

      return {
        totalExams: parseInt(metrics[0].total_exams),
        completionRate: parseFloat(metrics[0].completion_rate) || 0,
        averageScore: parseFloat(metrics[0].average_score) || 0,
        averageDuration: parseFloat(metrics[0].average_duration) || 0,
        examTypes: examTypeCounts,
        monthlyTrends: monthlyTrends.map(trend => ({
          month: trend.month,
          exams: parseInt(trend.exams),
          averageScore: parseFloat(trend.average_score) || 0,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get exam performance metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default ExamService;