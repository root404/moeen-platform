import express from 'express';
import { ExamController } from '../controllers/exam.controller';
import { authenticateToken, requireActiveUser } from '../middleware/auth.middleware';
import { validate, examSchema, examUpdateSchema, paginationSchema, idParamSchema } from '../middleware/validation.middleware';
import { quotaAwareLimiter } from '../middleware/quota.middleware';

const router = express.Router();

/**
 * @route   POST /api/exams
 * @desc    Create new exam
 * @access   Private
 */
router.post('/', 
  authenticateToken,
  requireActiveUser,
  quotaAwareLimiter,
  validate(examSchema, 'body'),
  ExamController.createExam
);

/**
 * @route   GET /api/exams
 * @desc    Get user's exams with pagination
 * @access   Private
 */
router.get('/', 
  authenticateToken,
  validate(paginationSchema, 'query'),
  ExamController.getUserExams
);

/**
 * @route   GET /api/exams/statistics
 * @desc    Get user's exam statistics
 * @access   Private
 */
router.get('/statistics', 
  authenticateToken,
  ExamController.getUserExamStatistics
);

/**
 * @route   GET /api/exams/surah/:surahId
 * @desc    Get exams for specific surah
 * @access   Private
 */
router.get('/surah/:surahId', 
  authenticateToken,
  validate(idParamSchema, 'params'),
  ExamController.getExamsBySurah
);

/**
 * @route   GET /api/exams/:id
 * @desc    Get specific exam by ID
 * @access   Private
 */
router.get('/:id', 
  authenticateToken,
  validate(idParamSchema, 'params'),
  ExamController.getExamById
);

/**
 * @route   PUT /api/exams/:id
 * @desc    Update exam
 * @access   Private
 */
router.put('/:id', 
  authenticateToken,
  validate(idParamSchema, 'params'),
  validate(examUpdateSchema, 'body'),
  ExamController.updateExam
);

/**
 * @route   POST /api/exams/:id/start
 * @desc    Start exam
 * @access   Private
 */
router.post('/:id/start', 
  authenticateToken,
  validate(idParamSchema, 'params'),
  ExamController.startExam
);

/**
 * @route   POST /api/exams/:id/complete
 * @desc    Complete exam with AI evaluation
 * @access   Private
 */
router.post('/:id/complete', 
  authenticateToken,
  validate(idParamSchema, 'params'),
  quotaAwareLimiter,
  ExamController.completeExam
);

/**
 * @route   POST /api/exams/:id/cancel
 * @desc    Cancel exam
 * @access   Private
 */
router.post('/:id/cancel', 
  authenticateToken,
  validate(idParamSchema, 'params'),
  ExamController.cancelExam
);

/**
 * @route   POST /api/exams/:id/increment-attempts
 * @desc    Increment exam attempts counter
 * @access   Private
 */
router.post('/:id/increment-attempts', 
  authenticateToken,
  validate(idParamSchema, 'params'),
  ExamController.incrementAttempts
);

// Admin routes
/**
 * @route   GET /api/exams/recent
 * @desc    Get recent exams (admin only)
 * @access   Admin
 */
router.get('/recent', 
  authenticateToken,
  requireAdmin,
  ExamController.getRecentExams
);

/**
 * @route   GET /api/exams/metrics
 * @desc    Get exam performance metrics (admin only)
 * @access   Admin
 */
router.get('/metrics', 
  authenticateToken,
  requireAdmin,
  ExamController.getExamPerformanceMetrics
);

/**
 * @route   GET /api/exams/all
 * @desc    Get all exams (admin only)
 * @access   Admin
 */
router.get('/all', 
  authenticateToken,
  requireAdmin,
  validate(paginationSchema, 'query'),
  ExamController.getAllExams
);

/**
 * @route   DELETE /api/exams/:id
 * @desc    Delete exam (admin only)
 * @access   Admin
 */
router.delete('/:id', 
  authenticateToken,
  requireAdmin,
  validate(idParamSchema, 'params'),
  ExamController.deleteExam
);

export default router;