import { Response } from 'express';
import { AuthRequest } from '../types';
import { UserService } from '../models/User.model';
import { QuotaPoolService } from '../models/QuotaPool.model';
import { ExamService } from '../models/Exam.model';
import { IstighfarService } from '../models/IstighfarSession.model';
import { AuditLogService } from '../models/AuditLog.model';
import { 
  sendSuccess, 
  sendError, 
  asyncHandler,
  parseInteger,
  validateUUID
} from '../utils/errors';
import { auditLogger, activityLogger } from '../utils/logger';

export class AdminController {
  /**
   * Get users with pagination and filters (admin/moderator only)
   */
  static getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { page = 1, limit = 20, search, role, subscriptionType, status, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    try {
      const options = {
        page: parseInteger(page as string),
        limit: parseInteger(limit as string),
        search: search as string,
        role: role as string,
        subscriptionType: subscriptionType as string,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const { users, total } = await UserService.getUsers(options);

      // Log admin action
      await AuditLogService.logAdminAction('get_users', adminId, undefined, {
        options
      });

      sendSuccess(res, users, 'Users retrieved successfully', {
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      });

    } catch (error: any) {
      await AuditLogService.logAdminAction('get_users', adminId, undefined, {
        error: error.message,
        options: req.query
      });

      sendError(res, error);
    }
  });

  /**
   * Get user by ID (admin only)
   */
  static getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { id } = req.params;

    try {
      const user = await UserService.getUserById(id);

      if (!user) {
        return sendError(res, {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }, 404);
      }

      // Log admin action
      await AuditLogService.logAdminAction('get_user', adminId, id, {
        userRole: user.role,
        userStatus: user.is_active ? 'active' : 'inactive'
      });

      // Get user statistics
      const stats = await UserService.getUserStats(id);

      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          subscription_type: user.subscription_type,
          date_of_birth: user.date_of_birth,
          country: user.country,
          gender: user.gender,
          phone: user.phone,
          profile_picture_url: user.profile_picture_url,
          is_active: user.is_active,
          email_verified: user.email_verified,
          created_at: user.created_at,
          last_active: user.last_active
        },
        stats
      }, 'User retrieved successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('get_user', adminId, id, {
        error: error.message
      });

      sendError(res, error);
    }
  });

  /**
   * Update user (admin only)
   */
  static updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { id } = req.params;
    const updateData = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      validateUUID(id, 'User ID');
      const user = await UserService.getUserById(id);

      if (!user) {
        return sendError(res, {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }, 404);
      }

      const updatedUser = await UserService.updateUser(id, updateData);

      // Log admin action
      await AuditLogService.logAdminAction('update_user', adminId, id, {
        updatedFields: Object.keys(updateData),
        ip,
        userAgent
      });

      activityLogger('User updated by admin', adminId, {
        targetUserId: id,
        updatedFields: Object.keys(updateData)
      });

      sendSuccess(res, updatedUser, 'User updated successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('update_user', adminId, id, {
        error: error.message,
        updatedFields: Object.keys(updateData),
        ip,
        userAgent
      });

      sendError(res, error);
    }
  });

  /**
   * Delete user (admin only)
   */
  static deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { id } = req.params;

    try {
      validateUUID(id, 'User ID');
      const success = await UserService.deleteUser(id);

      if (!success) {
        return sendError(res, {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }, 404);
      }

      // Log admin action
      await AuditLogService.logAdminAction('delete_user', adminId, id, {
        userRole: 'deleted',
        ip
      });

      activityLogger('User deleted by admin', adminId, {
        targetUserId: id
      });

      sendSuccess(res, null, 'User deleted successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('delete_user', adminId, id, {
        error: error.message,
        ip
      });

      sendError(res, error);
    }
  });

  /**
   * Activate user account (admin only)
   */
  static activateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { id } = req.params;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      validateUUID(id, 'User ID');
      const success = await UserService.activateUser(id);

      if (!success) {
        return sendError(res, {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }, 404);
      }

      // Log admin action
      await AuditLogService.logAdminAction('activate_user', adminId, id, {
        ip,
        userAgent
      });

      activityLogger('User activated by admin', adminId, {
        targetUserId: id
      });

      sendSuccess(res, null, 'User activated successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('activate_user', adminId, id, {
        error: error.message,
        ip,
        userAgent
      });

      sendError(res, error);
    }
  });

  /**
   * Get quota status and history (admin only)
   */
  static getQuotaStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;

    try {
      const quotaStatus = await QuotaPoolService.getQuotaStatusSummary();

      // Log admin action
      await AuditLogService.logAdminAction('get_quota_status', adminId);

      sendSuccess(res, quotaStatus, 'Quota status retrieved successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('get_quota_status', adminId, {
        error: error.message
      });

      sendError(res, error);
    }
  });

  /**
   * Reset daily quota (admin only)
   */
  static resetDailyQuota = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { newLimit } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      const updatedQuota = await QuotaPoolService.resetDailyQuota(newLimit);

      // Log admin action
      await AuditLogService.logAdminAction('reset_daily_quota', adminId, undefined, {
        newLimit,
        previousLimit: updatedQuota.free_pool_remaining_calls + updatedQuota.total_consumed
      });

      activityLogger('Daily quota reset by admin', adminId, {
        newLimit,
        previousLimit: updatedQuota.free_pool_remaining_calls + updatedQuota.total_consumed
      });

      sendSuccess(res, updatedQuota, 'Daily quota reset successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('reset_daily_quota', adminId, undefined, {
        error: error.message,
        newLimit
      });

      sendError(res, error);
    }
  });

  /**
   * Add quota (admin only)
   */
  static addQuota = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { amount } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      const updatedQuota = await QuotaPoolService.addQuota(amount);

      // Log admin action
      await AuditLogService.logAdminAction('add_quota', adminId, undefined, {
        amount,
        currentTotal: updatedQuota.free_pool_remaining_calls
      });

      activityLogger('Quota added by admin', adminId, {
        amount,
        currentTotal: updatedQuota.free_pool_remaining_calls
      });

      sendSuccess(res, updatedQuota, 'Quota added successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('add_quota', adminId, undefined, {
        error: error.message,
        amount
      });

      sendError(res, error);
    }
  });

  /**
   * Set daily quota limit (admin only)
   */
  static setDailyQuotaLimit = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { limit } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      const updatedQuota = await QuotaPoolService.setDailyQuotaLimit(limit);

      // Log admin action
      await AuditLogService.logAdminAction('set_daily_quota_limit', adminId, undefined, {
        newLimit: limit,
        previousLimit: updatedQuota.free_pool_remaining_calls + updatedQuota.total_consumed
      });

      activityLogger('Daily quota limit set by admin', adminId, {
        newLimit: limit,
        previousLimit: updatedQuota.free_pool_remaining_calls + updatedQuota.total_consumed
      });

      sendSuccess(res, updatedQuota, 'Daily quota limit updated successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('set_daily_quota_limit', adminId, undefined, {
        error: error.message,
        limit
      });

      sendError(res, error);
    }
  });

  /**
   * Get audit logs with pagination and filters (admin only)
   */
  static getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { page = 1, limit = 50, actionType, actor, startDate, endDate, success, sortBy = 'timestamp', sortOrder = 'desc' } = req.query;

    try {
      const options = {
        page: parseInteger(page as string),
        limit: parseInteger(limit as string),
        actionType: actionType as string,
        actor: actor as string,
        startDate: startDate as string,
        endDate: endDate as string,
        success: success ? 'true' : 'false' as 'true' | 'false',
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const { logs, total } = await AuditLogService.getAuditLogs(options);

      // Log admin action
      await AuditLogService.logAdminAction('get_audit_logs', adminId);

      sendSuccess(res, logs, 'Audit logs retrieved successfully', {
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          totalPages: Math.ceil(total / options.limit)
        }
      });

    } catch (error: any) {
      await AuditLogService.logAdminAction('get_audit_logs', adminId, {
        error: error.message
      });

      sendError(res, error);
    }
  });

  /**
   * Export audit logs (admin only)
   */
  static exportAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { actionType, startDate, endDate, format } = req.query;

    try {
      const logs = await AuditLogService.exportAuditLogs({
        actionType,
        startDate,
        endDate,
        format: format as 'json' | 'csv'
      });

      // Log admin action
      await AuditLogService.logAdminAction('export_audit_logs', adminId, {
        actionType,
        startDate,
        endDate,
        format
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      }

      sendSuccess(res, logs, 'Audit logs exported successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('export_audit_logs', adminId, {
        error: error.message,
        actionType,
        startDate,
        endDate,
        format
      });

      sendError(res, error);
    }
  });

  /**
   * Get platform analytics (admin only)
   */
  static getAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;

    try {
      const [
        userStats,
        examStats,
        istighfarStats,
        quotaStats,
        recentExams,
        recentIstighfar
      ] = await Promise.all([
        UserService.getUserStatistics(),
        ExamService.getExamPerformanceMetrics(),
        IstighfarService.getSessionPerformanceMetrics(),
        QuotaPoolService.getQuotaUsageStatistics(),
        ExamService.getRecentExams(50),
        IstighfarService.getRecentSessions(50)
      ]);

      const analytics = {
        users: userStats,
        exams: examStats,
        istighfar: istighfarStats,
        quota: quotaStats,
        recentActivity: {
          exams: recentExams,
          istighfar: recentIstighfar
        }
      };

      // Log admin action
      await AuditLogService.logAdminAction('get_analytics', adminId);

      sendSuccess(res, analytics, 'Analytics retrieved successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('get_analytics', adminId, {
        error: error.message
      });

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
        page: parseInteger(page as string),
        limit: parseInteger(limit as string),
        examType: examType as string,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const { exams, total } = await ExamService.getExamsByUserId('', options);

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
      await AuditLogService.logAdminAction('get_all_exams', adminId, {
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
      await AuditLogService.logAdminAction('get_all_exams', adminId, {
        error: error.message,
        options: req.query
      });

      sendError(res, error);
    }
  });

  /**
   * Get istighfar analytics (admin only)
   */
  static getIstighfarAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;

    try {
      const [
        recentSessions,
        performanceMetrics,
        leaderboards,
        userStats
      ] = await Promise.all([
        IstighfarService.getRecentSessions(50),
        IstighfarService.getSessionPerformanceMetrics(),
        IstighfarService.getGlobalLeaderboard(),
        IstighfarService.getSessionPerformanceMetrics()
      ]);

      const analytics = {
        recentSessions,
        performanceMetrics,
        leaderboards,
        userStats
      };

      // Log admin action
      await AuditLogService.logAdminAction('get_istighfar_analytics', adminId);

      sendSuccess(res, analytics, 'Istighfar analytics retrieved successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('get_istighfar_analytics', adminId, {
        error: error.message
      });

      sendError(res, error);
    }
  });

  /**
   * Get dashboard statistics (admin only)
   */
  static getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;

    try {
      const [
        totalUsers,
        activeUsers,
        totalExams,
        completedExams,
        totalIstighfarSessions,
        totalQuotaConsumed,
        currentQuotaRemaining
      ] = await Promise.all([
        UserService.getUserStatistics(),
        ExamService.getExamPerformanceMetrics(),
        IstighfarService.getSessionPerformanceMetrics(),
        QuotaPoolService.getQuotaUsageStatistics()
      ]);

      const stats = {
        users: totalUsers,
        activeUsers: activeUsers,
        exams: {
          total: totalExams.totalExams,
          completed: completedExams.completedExams,
          averageScore: totalExams.averageScore
        },
        istighfar: {
          totalSessions: totalIstighfar.totalSessions,
          totalRepetitions: totalIstighfar.totalRepetitions,
          averageSessionLength: totalIstighfar.averageSessionLength,
          totalDuration: totalIstighfar.totalDuration
        },
        quota: {
          totalConsumed: totalQuotaConsumed.totalConsumed,
          remainingCalls: currentQuotaRemaining
        },
        timestamp: new Date()
      };

      // Log admin action
      await AuditLogService.logAdminAction('get_dashboard_stats', adminId);

      sendSuccess(res, stats, 'Dashboard statistics retrieved successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('get_dashboard_stats', adminId, {
        error: error.message
      });

      sendError(res, error);
    }
  });

  /**
   * Send notification to users (admin only)
   */
  static sendNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId;
    const { userIds, title, message, type, data } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      // Validate required fields
      if (!userIds || !title || !message || !type) {
        return sendError(res, {
          message: 'User IDs, title, message, and type are required',
          code: 'REQUIRED_FIELDS_MISSING'
        }, 400);
      }

      // In a real implementation, you would send actual notifications
      // For now, we'll just log the notification
      
      // Log notification attempt for each user
      for (const targetUserId of userIds) {
        await AuditLogService.logDataAccess(targetUserId, 'notification', 'sent', true, {
          title,
          message,
          type,
          ip
        });
      }

      // Log admin action
      await AuditLogService.logAdminAction('send_notification', adminId, undefined, {
        userIds,
        title,
        message,
        type,
        ip,
        userAgent
      });

      sendSuccess(res, {
        message: 'Notifications queued for delivery',
        sentToUsers: userIds.length
      }, 'Notifications queued successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('send_notification', adminId, undefined, {
        error: error.message,
        userIds
      });

      sendError(res, error);
    }
  });
}

export default AdminController;