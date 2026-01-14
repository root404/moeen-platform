import express from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, requireAdmin, requireModerator } from '../middleware/auth.middleware';
import { validate, paginationSchema } from '../middleware/validation.middleware';

const router = express.Router();

/**
 * @route   GET /api/admin/users
 * @desc    Get users with pagination and filters (admin/moderator)
 * @access   Admin/Moderator
 */
router.get('/users', 
  authenticateToken,
  requireAdmin,
  validate(paginationSchema, 'query'),
  AdminController.getUsers
);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID (admin only)
 * @access   Admin
 */
router.get('/users/:id', 
  authenticateToken,
  requireAdmin,
  AdminController.getUserById
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user (admin only)
 * @access   Admin
 */
router.put('/users/:id', 
  authenticateToken,
  requireAdmin,
  AdminController.updateUser
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user (admin only)
 * @access   Admin
 */
router.delete('/users/:id', 
  authenticateToken,
  requireAdmin,
  AdminController.deleteUser
);

/**
 * @route   POST /api/admin/users/:id/activate
 * @desc    Activate user account (admin only)
 * @access   Admin
 */
router.post('/users/:id/activate', 
  authenticateToken,
  requireAdmin,
  AdminController.activateUser
);

/**
 * @route   POST /api/admin/users/:id/deactivate
 * @desc    Deactivate user account (admin only)
 * @access   Admin
 */
router.post('/users/:id/deactivate', 
  authenticateToken,
  requireAdmin,
  AdminController.deactivateUser
);

/**
 * @route   GET /api/admin/quota
 * @desc    Get quota status and history (admin only)
 * @access   Admin
 */
router.get('/quota', 
  authenticateToken,
  requireAdmin,
  AdminController.getQuotaStatus
);

/**
 * @route   POST /api/admin/quota/reset
 * @desc    Reset daily quota (admin only)
 * @access   Admin
 */
router.post('/quota/reset', 
  authenticateToken,
  requireAdmin,
  AdminController.resetDailyQuota
);

/**
 * @route   POST /api/admin/quota/add
 * @desc    Add quota (admin only)
 * @access   Admin
 */
router.post('/quota/add', 
  authenticateToken,
  requireAdmin,
  AdminController.addQuota
);

/**
 * @route   PUT /api/admin/quota/limit
 * @desc    Set daily quota limit (admin only)
 * @access   Admin
 */
router.put('/quota/limit', 
  authenticateToken,
  requireAdmin,
  AdminController.setDailyQuotaLimit
);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs with pagination and filters (admin only)
 * @access   Admin
 */
router.get('/audit-logs', 
  authenticateToken,
  requireAdmin,
  validate(paginationSchema, 'query'),
  AdminController.getAuditLogs
);

/**
 * @route   GET /api/admin/audit-logs/export
 * @desc    Export audit logs (admin only)
 * @access   Admin
 */
router.get('/audit-logs/export', 
  authenticateToken,
  requireAdmin,
  AdminController.exportAuditLogs
);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get platform analytics (admin only)
 * @access   Admin
 */
router.get('/analytics', 
  authenticateToken,
  requireAdmin,
  AdminController.getAnalytics
);

/**
 * @route   GET /api/admin/exams
 * @desc    Get all exams with analytics (admin only)
 * @access   Admin
 */
router.get('/exams', 
  authenticateToken,
  requireAdmin,
  validate(paginationSchema, 'query'),
  AdminController.getAllExams
);

/**
 * @route   GET /api/admin/istighfar
 * @desc    Get istighfar analytics and recent sessions (admin only)
 * @access   Admin
 */
router.get('/istighfar', 
  authenticateToken,
  requireAdmin,
  AdminController.getIstighfarAnalytics
);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard statistics (admin only)
 * @access   Admin
 */
router.get('/dashboard', 
  authenticateToken,
  requireAdmin,
  AdminController.getDashboardStats
);

/**
 * @route   POST /api/admin/notifications/send
 * @desc    Send notification to users (admin only)
 * @access   Admin
 */
router.post('/notifications/send', 
  authenticateToken,
  requireAdmin,
  AdminController.sendNotification
);

export default router;