import { Response } from 'express';
import { AuthRequest, ExamCreateInput, ExamUpdateInput } from '../types';
import { ExamService } from '../models/Exam.model';
import { SurahService } from '../models/Surah.model';
import { AuditLogService } from '../models/AuditLog.model';
import { QuotaPoolService } from '../models/QuotaPool.model';
import { 
  sendSuccess, 
  sendError, 
  asyncHandler,
  validateUUID,
  validateRequired
} from '../utils/errors';
import { activityLogger, aiLogger } from '../utils/logger';

export class ExamController {
  /**
   * Create new exam
   */
  static createExam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const examData: ExamCreateInput = req.body;

    try {
      // Validate required fields
      validateRequired(userId, 'User ID');
      validateRequired(examData.surah_id, 'Surah ID');
      validateRequired(examData.exam_type, 'Exam type');

      // Validate surah exists
      const surah = await SurahService.getSurahById(examData.surah_id);
      if (!surah) {
        return sendError(res, {
          message: 'Invalid surah ID',
          code: 'INVALID_SURAH_ID'
        }, 400);
      }

      // Create exam with user ID
      const exam = await ExamService.createExam({
        user_id: userId,
        surah_id: examData.surah_id,
        exam_type: examData.exam_type,
        score: examData.score,
        max_score: examData.max_score,
        status: examData.status,
        duration_seconds: examData.duration_seconds,
        attempts_count: examData.attempts_count
      });

      // Update quota consumption for AI-dependent exam types
      if (['learning', 'final'].includes(examData.exam_type)) {
        await QuotaPoolService.updateQuotaConsumption(1, userId, {
          examType: examData.exam_type,
          action: 'exam_creation',
          surahId: examData.surah_id
        });
      }

      // Log exam creation
      await AuditLogService.logDataAccess(userId, 'exam', exam.id, 'create', true, {
        examType: examData.exam_type,
        surahId: examData.surah_id
      });

      // Get surah details for response
      const examWithSurah = {
        ...exam,
        surah_name: surah.name_ar,
        surah_name_en: surah.name_en,
        verses_count: surah.verses_count
      };

      activityLogger('Exam created successfully', userId, {
        examId: exam.id,
        examType: examData.exam_type,
        surahId: examData.surah_id
      });

      sendSuccess(res, examWithSurah, 'Exam created successfully', 201);

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'exam', 'unknown', 'create', false, {
          error: error.message,
          examData
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get user's exams with pagination
   */
  static getUserExams = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { page = 1, limit = 20, examType, status, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        examType: examType as string,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const { exams, total } = await ExamService.getExamsByUserId(userId, options);

      // Get surah details for each exam
      const examsWithSurah = await Promise.all(
        exams.map(async (exam) => {
          const surah = await SurahService.getSurahById(exam.surah_id);
          return {
            ...exam,
            surah_name: surah?.name_ar || '',
            surah_name_en: surah?.name_en || '',
            verses_count: surah?.verses_count || 0
          };
        })
      );

      // Log data access
      await AuditLogService.logDataAccess(userId, 'exam', 'list', 'read', true, {
        options
      });

      sendSuccess(res, examsWithSurah, 'Exams retrieved successfully', {
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      });

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'exam', 'list', 'read', false, {
          error: error.message,
          options: req.query
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get user's exam statistics
   */
  static getUserExamStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      const stats = await ExamService.getUserExamStatistics(userId);

      // Log data access
      await AuditLogService.logDataAccess(userId, 'exam', 'statistics', 'read', true);

      sendSuccess(res, stats, 'Exam statistics retrieved successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'exam', 'statistics', 'read', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get exams for specific surah
   */
  static getExamsBySurah = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { surahId } = req.params;
    const { page = 1, limit = 20, examType, status } = req.query;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      // Validate surah exists
      const surah = await SurahService.getSurahById(parseInt(surahId));
      if (!surah) {
        return sendError(res, {
          message: 'Surah not found',
          code: 'SURAH_NOT_FOUND'
        }, 404);
      }

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        examType: examType as string,
        status: status as string
      };

      const { exams, total } = await ExamService.getExamsBySurah(parseInt(surahId), options);

      // Log data access
      await AuditLogService.logDataAccess(userId, 'exam', 'by_surah', 'read', true, {
        surahId: parseInt(surahId),
        options
      });

      sendSuccess(res, {
        surah: {
          id: surah.id,
          name_ar: surah.name_ar,
          name_en: surah.name_en,
          verses_count: surah.verses_count
        },
        exams
      }, `Exams for Surah ${surah.name_ar} retrieved successfully`, {
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      });

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'exam', 'by_surah', 'read', false, {
          error: error.message,
          surahId
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get specific exam by ID
   */
  static getExamById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(id, 'Exam ID');
      const exam = await ExamService.getExamById(id);

      if (!exam) {
        return sendError(res, {
          message: 'Exam not found',
          code: 'EXAM_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this exam or is admin
      if (exam.user_id !== userId && req.user?.role !== 'admin') {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      // Get surah details
      const surah = await SurahService.getSurahById(exam.surah_id);

      // Log data access
      await AuditLogService.logDataAccess(userId, 'exam', id, 'read', true);

      sendSuccess(res, {
        ...exam,
        surah: {
          id: surah.id,
          name_ar: surah.name_ar,
          name_en: surah.name_en,
          verses_count: surah.verses_count
        }
      }, 'Exam retrieved successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'exam', id, 'read', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Update exam
   */
  static updateExam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;
    const updateData: ExamUpdateInput = req.body;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(id, 'Exam ID');
      const existingExam = await ExamService.getExamById(id);

      if (!existingExam) {
        return sendError(res, {
          message: 'Exam not found',
          code: 'EXAM_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this exam or is admin
      if (existingExam.user_id !== userId && req.user?.role !== 'admin') {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      const updatedExam = await ExamService.updateExam(id, updateData);

      // Log data access
      await AuditLogService.logDataAccess(userId, 'exam', id, 'update', true, {
        updatedFields: Object.keys(updateData)
      });

      activityLogger('Exam updated successfully', userId, {
        examId: id,
        updatedFields: Object.keys(updateData)
      });

      sendSuccess(res, updatedExam, 'Exam updated successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'exam', id, 'update', false, {
          error: error.message,
          updatedFields: Object.keys(updateData)
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Start exam
   */
  static startExam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(id, 'Exam ID');
      const exam = await ExamService.getExamById(id);

      if (!exam) {
        return sendError(res, {
          message: 'Exam not found',
          code: 'EXAM_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this exam
      if (exam.user_id !== userId) {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      if (exam.status !== 'pending') {
        return sendError(res, {
          message: 'Exam cannot be started. It may already be started or completed.',
          code: 'EXAM_CANNOT_BE_STARTED'
        }, 400);
      }

      const startedExam = await ExamService.startExam(id);

      // Log exam start
      await AuditLogService.logDataAccess(userId, 'exam', id, 'start', true);

      activityLogger('Exam started successfully', userId, {
        examId: id
      });

      sendSuccess(res, startedExam, 'Exam started successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'exam', id, 'start', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Complete exam with AI evaluation
   */
  static completeExam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;
    const { score, transcript, audioDuration } = req.body;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(id, 'Exam ID');
      const exam = await ExamService.getExamById(id);

      if (!exam) {
        return sendError(res, {
          message: 'Exam not found',
          code: 'EXAM_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this exam
      if (exam.user_id !== userId) {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      if (exam.status !== 'in_progress') {
        return sendError(res, {
          message: 'Exam cannot be completed. It may not be in progress.',
          code: 'EXAM_NOT_IN_PROGRESS'
        }, 400);
      }

      // AI evaluation would happen here with Gemini
      // For now, we'll simulate the evaluation result
      const aiEvaluation = {
        score: score || 0,
        maxScore: 100,
        errors: [],
        fluency: 0,
        accuracy: 0,
        confidence: 0,
        feedback: 'Exam completed successfully',
        passed: score >= 90
      };

      const completedExam = await ExamService.completeExam(id, score || 0, aiEvaluation);

      // Log exam completion
      await AuditLogService.logDataAccess(userId, 'exam', id, 'complete', true, {
        score: score,
        passed: aiEvaluation.passed
      });

      activityLogger('Exam completed successfully', userId, {
        examId: id,
        score: score,
        passed: aiEvaluation.passed
      });

      sendSuccess(res, completedExam, 'Exam completed successfully', {
        aiEvaluation,
        passed: aiEvaluation.passed
      });

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'exam', id, 'complete', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Cancel exam
   */
  static cancelExam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(id, 'Exam ID');
      const exam = await ExamService.getExamById(id);

      if (!exam) {
        return sendError(res, {
          message: 'Exam not found',
          code: 'EXAM_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this exam
      if (exam.user_id !== userId) {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      const cancelledExam = await ExamService.cancelExam(id, reason);

      // Log exam cancellation
      await AuditLogService.logDataAccess(userId, 'exam', id, 'cancel', true, {
        reason
      });

      activityLogger('Exam cancelled successfully', userId, {
        examId: id,
        reason
      });

      sendSuccess(res, cancelledExam, 'Exam cancelled successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'exam', id, 'cancel', false, {
          error: error.message,
          reason
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Increment exam attempts counter
   */
  static incrementAttempts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(id, 'Exam ID');
      const exam = await ExamService.getExamById(id);

      if (!exam) {
        return sendError(res, {
          message: 'Exam not found',
          code: 'EXAM_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this exam
      if (exam.user_id !== userId) {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      const updatedExam = await ExamService.incrementAttempts(id);

      // Log attempt increment
      await AuditLogService.logDataAccess(userId, 'exam', id, 'increment_attempts', true);

      activityLogger('Exam attempts incremented', userId, {
        examId: id,
        attemptsCount: updatedExam.attempts_count
      });

      sendSuccess(res, updatedExam, 'Exam attempts incremented successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'exam', id, 'increment_attempts', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  // Admin methods
  /**
   * Get recent exams (admin only)
   */
  static getRecentExams = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { limit = 50 } = req.query;

    try {
      const exams = await ExamService.getRecentExams(parseInt(limit as string));

      // Log admin action
      await AuditLogService.logAdminAction('get_recent_exams', adminId, undefined, {
        limit
      });

      sendSuccess(res, exams, 'Recent exams retrieved successfully');

    } catch (error: any) {
      if (adminId) {
        await AuditLogService.logAdminAction('get_recent_exams', adminId, undefined, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get exam performance metrics (admin only)
   */
  static getExamPerformanceMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;

    try {
      const metrics = await ExamService.getExamPerformanceMetrics();

      // Log admin action
      await AuditLogService.logAdminAction('get_exam_metrics', adminId, undefined);

      sendSuccess(res, metrics, 'Exam performance metrics retrieved successfully');

    } catch (error: any) {
      if (adminId) {
        await AuditLogService.logAdminAction('get_exam_metrics', adminId, undefined, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get all exams (admin only)
   */
  static getAllExams = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { page = 1, limit = 20, examType, status, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    try {
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        examType: examType as string,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const { exams, total } = await ExamService.getExamsByUserId('', options); // Empty userId to get all exams

      // Get surah details for each exam
      const examsWithSurah = await Promise.all(
        exams.map(async (exam) => {
          const surah = await SurahService.getSurahById(exam.surah_id);
          return {
            ...exam,
            surah_name: surah?.name_ar || '',
            surah_name_en: surah?.name_en || '',
            verses_count: surah?.verses_count || 0
          };
        })
      );

      // Log admin action
      await AuditLogService.logAdminAction('get_all_exams', adminId, undefined, {
        options
      });

      sendSuccess(res, examsWithSurah, 'All exams retrieved successfully', {
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      });

    } catch (error: any) {
      if (adminId) {
        await AuditLogService.logAdminAction('get_all_exams', adminId, undefined, {
          error: error.message,
          options: req.query
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Delete exam (admin only)
   */
  static deleteExam = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { id } = req.params;

    try {
      validateUUID(id, 'Exam ID');
      const success = await ExamService.deleteExam(id);

      if (!success) {
        return sendError(res, {
          message: 'Exam not found',
          code: 'EXAM_NOT_FOUND'
        }, 404);
      }

      // Log admin action
      await AuditLogService.logAdminAction('delete_exam', adminId, undefined, {
        deletedExamId: id
      });

      activityLogger('Exam deleted by admin', adminId, {
        deletedExamId: id
      });

      sendSuccess(res, null, 'Exam deleted successfully');

    } catch (error: any) {
      if (adminId) {
        await AuditLogService.logAdminAction('delete_exam', adminId, undefined, {
          error: error.message,
          deletedExamId: id
        });
      }

      sendError(res, error);
    }
  });
}

export default ExamController;