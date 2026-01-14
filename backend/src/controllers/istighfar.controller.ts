import { Response } from 'express';
import { AuthRequest, IstighfarSessionCreateInput } from '../types';
import { IstighfarService } from '../models/IstighfarSession.model';
import { AuditLogService } from '../models/AuditLog.model';
import { 
  sendSuccess, 
  sendError, 
  asyncHandler,
  validateUUID,
  validateRequired
} from '../utils/errors';
import { activityLogger } from '../utils/logger';

export class IstighfarController {
  /**
   * Create new istighfar session
   */
  static createSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const sessionData: IstighfarSessionCreateInput = req.body;

    try {
      // Validate required fields
      validateRequired(userId, 'User ID');

      // Create session
      const session = await IstighfarService.createSession({
        user_id: userId,
        duration_seconds: sessionData.duration_seconds || 120,
        counted_repetitions: sessionData.counted_repetitions || 0,
        target_repetitions: sessionData.target_repetitions,
        session_type: sessionData.session_type || 'personal',
        end_time: sessionData.end_time,
        completion_rate: sessionData.completion_rate,
        notes: sessionData.notes
      });

      // Log session creation
      await AuditLogService.logDataAccess(userId, 'istighfar', session.session_id, 'create', true, {
        sessionType: session.session_type,
        targetRepetitions: session.target_repetitions
      });

      activityLogger('Istighfar session created successfully', userId, {
        sessionId: session.session_id,
        sessionType: session.session_type,
        targetRepetitions: session.target_repetitions
      });

      sendSuccess(res, session, 'Istighfar session created successfully', 201);

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', 'unknown', 'create', false, {
          error: error.message,
          sessionData
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get user's istighfar sessions with pagination
   */
  static getUserSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { 
      page = 1, 
      limit = 20, 
      sessionType, 
      startDate, 
      endDate, 
      sortBy = 'created_at', 
      sortOrder = 'desc' 
    } = req.query;

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
        sessionType: sessionType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const { sessions, total } = await IstighfarService.getSessionsByUserId(userId, options);

      // Log data access
      await AuditLogService.logDataAccess(userId, 'istighfar', 'list', 'read', true, {
        options
      });

      sendSuccess(res, sessions, 'Istighfar sessions retrieved successfully', {
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      });

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', 'list', 'read', false, {
          error: error.message,
          options: req.query
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get specific istighfar session by ID
   */
  static getSessionById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { sessionId } = req.params;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(sessionId, 'Session ID');
      const session = await IstighfarService.getSessionById(sessionId);

      if (!session) {
        return sendError(res, {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this session
      if (session.user_id !== userId && req.user?.role !== 'admin') {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      // Log data access
      await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'read', true);

      sendSuccess(res, session, 'Session retrieved successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'read', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Update istighfar session
   */
  static updateSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { sessionId } = req.params;
    const updateData = req.body;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(sessionId, 'Session ID');
      const existingSession = await IstighfarService.getSessionById(sessionId);

      if (!existingSession) {
        return sendError(res, {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this session
      if (existingSession.user_id !== userId && req.user?.role !== 'admin') {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      // Only allow updating certain fields for in-progress sessions
      const allowedFields = ['end_time', 'completion_rate', 'notes'];
      const updateKeys = Object.keys(updateData);
      const hasInvalidFields = updateKeys.some(key => !allowedFields.includes(key));

      if (hasInvalidFields) {
        return sendError(res, {
          message: 'Cannot update these fields for an active session',
          code: 'INVALID_UPDATE_FIELDS',
          details: { invalidFields: updateKeys.filter(key => !allowedFields.includes(key)) }
        }, 400);
      }

      const updatedSession = await IstighfarService.updateSession(sessionId, updateData);

      // Log session update
      await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'update', true, {
        updatedFields: updateKeys
      });

      activityLogger('Istighfar session updated successfully', userId, {
        sessionId,
        updatedFields
      });

      sendSuccess(res, updatedSession, 'Session updated successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'update', false, {
          error: error.message,
          updateData
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Complete istighfar session
   */
  static completeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { sessionId } = req.params;
    const { finalDuration, finalRepetitions } = req.body;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(sessionId, 'Session ID');
      const session = await IstighfarService.getSessionById(sessionId);

      if (!session) {
        return sendError(res, {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this session
      if (session.user_id !== userId) {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      if (session.end_time) {
        return sendError(res, {
          message: 'Session is already completed',
          code: 'SESSION_ALREADY_COMPLETED'
        }, 400);
      }

      if (!finalDuration || !finalRepetitions) {
        return sendError(res, {
          message: 'Final duration and repetitions are required',
          code: 'FINAL_DATA_REQUIRED'
        }, 400);
      }

      const completedSession = await IstighfarService.completeSession(sessionId, finalDuration, finalRepetitions);

      // Log session completion
      await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'complete', true, {
        finalDuration,
        finalRepetitions,
        completionRate: completedSession.completion_rate
      });

      activityLogger('Istighfar session completed successfully', userId, {
        sessionId,
        finalDuration,
        finalRepetitions,
        completionRate: completedSession.completion_rate
      });

      sendSuccess(res, completedSession, 'Session completed successfully', {
        completionRate: completedSession.completion_rate
      });

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'complete', false, {
          error: error.message,
          finalDuration,
          finalRepetitions
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Delete istighfar session
   */
  static deleteSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { sessionId } = req.params;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(sessionId, 'Session ID');
      const success = await IstighfarService.deleteSession(sessionId);

      if (!success) {
        return sendError(res, {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }, 404);
      }

      // Log session deletion
      await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'delete', true);

      activityLogger('Istighfar session deleted successfully', userId, {
        sessionId
      });

      sendSuccess(res, null, 'Session deleted successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'delete', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Start istighfar session
   */
  static startSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { sessionId } = req.params;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(sessionId, 'Session ID');
      const session = await IstighfarService.getSessionById(sessionId);

      if (!session) {
        return sendError(res, {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this session
      if (session.user_id !== userId) {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      if (session.end_time) {
        return sendError(res, {
          message: 'Session cannot be started. It is already completed.',
          code: 'SESSION_ALREADY_COMPLETED'
        }, 400);
      }

      // For istighfar, we don't need to "start" like exams
      // Sessions are auto-started when created
      // This endpoint could be used to resume paused sessions
      const resumedSession = await IstighfarService.updateSession(sessionId, {
        // No update needed for istighfar
      });

      // Log session resume/start
      await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'start', true);

      activityLogger('Istighfar session started/resumed successfully', userId, {
        sessionId
      });

      sendSuccess(res, resumedSession, 'Session started/resumed successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'start', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Pause istighfar session
   */
  static pauseSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { sessionId } = req.params;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(sessionId, 'Session ID');
      const session = await IstighfarService.getSessionById(sessionId);

      if (!session) {
        return sendError(res, {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this session
      if (session.user_id !== userId) {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      if (session.end_time) {
        return sendError(res, {
          message: 'Cannot pause a completed session',
          code: 'SESSION_ALREADY_COMPLETED'
        }, 400);
      }

      // For istighfar, we don't actually pause but could record the state
      const pausedSession = await IstighfarService.updateSession(sessionId, {
        // Add a note about pausing
        notes: session.notes ? `Paused: ${session.notes}` : 'Session paused'
      });

      // Log session pause
      await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'pause', true);

      activityLogger('Istighfar session paused', userId, {
        sessionId
      });

      sendSuccess(res, pausedSession, 'Session paused successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'pause', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Resume istighfar session
   */
  static resumeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { sessionId } = req.params;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(sessionId, 'Session ID');
      const session = await IstighfarService.getSessionById(sessionId);

      if (!session) {
        return sendError(res, {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this session
      if (session.user_id !== userId) {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      if (session.end_time) {
        return sendError(res, {
          message: 'Cannot resume a completed session',
          code: 'SESSION_ALREADY_COMPLETED'
        }, 400);
      }

      const resumedSession = await IstighfarService.updateSession(sessionId, {
        notes: session.notes ? session.notes.replace(/Paused: /, '') : null
      });

      // Log session resume
      await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'resume', true);

      activityLogger('Istighfar session resumed', userId, {
        sessionId
      });

      sendSuccess(res, resumedSession, 'Session resumed successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'resume', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get session statistics
   */
  static getSessionStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { sessionId } = req.params;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      validateUUID(sessionId, 'Session ID');
      const session = await IstighfarService.getSessionById(sessionId);

      if (!session) {
        return sendError(res, {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        }, 404);
      }

      // Check if user owns this session
      if (session.user_id !== userId && req.user?.role !== 'admin') {
        return sendError(res, {
          message: 'Access denied',
          code: 'ACCESS_DENIED'
        }, 403);
      }

      // Get session statistics
      const stats = await IstighfarService.getUserSessionStatistics(userId);

      // Log data access
      await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'stats', true);

      sendSuccess(res, {
        session,
        stats
      }, 'Session statistics retrieved successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', sessionId, 'stats', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  // Leaderboard methods
  /**
   * Get global leaderboard
   */
  static getGlobalLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit = 50, timeFrame = 'all', sessionType } = req.query;

    try {
      const options = {
        limit: parseInt(limit as string),
        timeFrame: timeFrame as 'all' | 'week' | 'month',
        sessionType: sessionType as string
      };

      const leaderboard = await IstighfarService.getGlobalLeaderboard(options);

      sendSuccess(res, leaderboard, 'Global leaderboard retrieved successfully');

    } catch (error: any) {
      sendError(res, error);
    }
  });

  /**
   * Get weekly leaderboard
   */
  static getWeeklyLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit = 20 } = req.query;

    try {
      const weeklyLeaderboard = await IstighfarService.getWeeklyLeaderboard(parseInt(limit as string));

      sendSuccess(res, weeklyLeaderboard, 'Weekly leaderboard retrieved successfully');

    } catch (error: any) {
      sendError(res, error);
    }
  });

  /**
   * Get monthly leaderboard
   */
  static getMonthlyLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit = 20 } = req.query;

    try {
      const options = {
        limit: parseInt(limit as string),
        timeFrame: 'month'
      };

      const leaderboard = await IstighfarService.getGlobalLeaderboard(options);

      sendSuccess(res, leaderboard, 'Monthly leaderboard retrieved successfully');

    } catch (error: any) {
      sendError(res, error);
    }
  });

  /**
   * Get user's leaderboard position
   */
  static getUserLeaderboardPosition = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { userId: targetUserId } = req.params;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      // User can get their own position or another user's position
      const targetId = targetUserId || userId;

      const leaderboard = await IstighfarService.getGlobalLeaderboard({
        limit: 100 // Get top 100 to find position
      });

      const userEntry = leaderboard.find(entry => entry.userId === targetId);

      if (!userEntry) {
        return sendError(res, {
          message: 'User not found in leaderboard',
          code: 'USER_NOT_IN_LEADERBOARD'
        }, 404);
      }

      sendSuccess(res, {
        userId: targetId,
        position: userEntry.rank,
        score: userEntry.totalRepetitions,
        totalTime: userEntry.totalDuration
      }, 'User leaderboard position retrieved successfully');

    } catch (error: any) {
      sendError(res, error);
    }
  });

  // User statistics methods
  /**
   * Get user's istighfar statistics
   */
  static getUserStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      const stats = await IstighfarService.getUserSessionStatistics(userId);

      // Log data access
      await AuditLogService.logDataAccess(userId, 'istighfar', 'statistics', 'read', true);

      sendSuccess(res, stats, 'User istighfar statistics retrieved successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', 'statistics', 'read', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get user's personal records
   */
  static getPersonalRecords = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      const records = await IstighfarService.getPersonalRecords(userId);

      // Log data access
      await AuditLogService.logDataAccess(userId, 'istighfar', 'personal_records', 'read', true);

      sendSuccess(res, records, 'Personal records retrieved successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', 'personal_records', 'read', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });

  /**
   * Get user's streak information
   */
  static getStreakInfo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      const records = await IstighfarService.getPersonalRecords(userId);
      const streakDays = records.streakDays || 0;

      // Log data access
      await AuditLogService.logDataAccess(userId, 'istighfar', 'streak_info', 'read', true);

      sendSuccess(res, {
        currentStreak: streakDays,
        message: streakDays > 0 ? `You're on a ${streakDays}-day streak!` : 'Start your daily istighfar to build a streak!'
      }, 'Streak information retrieved successfully');

    } catch (error: any) {
      if (userId) {
        await AuditLogService.logDataAccess(userId, 'istighfar', 'streak_info', 'read', false, {
          error: error.message
        });
      }

      sendError(res, error);
    }
  });
}

export default IstighfarController;