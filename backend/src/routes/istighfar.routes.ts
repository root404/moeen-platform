import express from 'express';
import { IstighfarController } from '../controllers/istighfar.controller';
import { authenticateToken, requireActiveUser } from '../middleware/auth.middleware';
import { validate, istighfarSchema, paginationSchema } from '../middleware/validation.middleware';

const router = express.Router();

/**
 * @route   POST /api/istighfar/sessions
 * @desc    Create new istighfar session
 * @access   Private
 */
router.post('/sessions', 
  authenticateToken,
  requireActiveUser,
  validate(istighfarSchema, 'body'),
  IstighfarController.createSession
);

/**
 * @route   GET /api/istighfar/sessions
 * @desc    Get user's istighfar sessions with pagination
 * @access   Private
 */
router.get('/sessions', 
  authenticateToken,
  validate(paginationSchema, 'query'),
  IstighfarController.getUserSessions
);

/**
 * @route   GET /api/istighfar/sessions/:sessionId
 * @desc    Get specific istighfar session
 * @access   Private
 */
router.get('/sessions/:sessionId', 
  authenticateToken,
  IstighfarController.getSessionById
);

/**
 * @route   PUT /api/istighfar/sessions/:sessionId
 * @desc    Update istighfar session
 * @access   Private
 */
router.put('/sessions/:sessionId', 
  authenticateToken,
  IstighfarController.updateSession
);

/**
 * @route   POST /api/istighfar/sessions/:sessionId/complete
 * @desc    Complete istighfar session
 * @access   Private
 */
router.post('/sessions/:sessionId/complete', 
  authenticateToken,
  IstighfarController.completeSession
);

/**
 * @route   DELETE /api/istighfar/sessions/:sessionId
 * @desc    Delete istighfar session
 * @access   Private
 */
router.delete('/sessions/:sessionId', 
  authenticateToken,
  IstighfarController.deleteSession
);

/**
 * @route   POST /api/istighfar/sessions/:sessionId/start
 * @desc    Start istighfar session
 * @access   Private
 */
router.post('/sessions/:sessionId/start', 
  authenticateToken,
  IstighfarController.startSession
);

/**
 * @route   POST /api/istighfar/sessions/:sessionId/pause
 * @desc    Pause istighfar session
 * @access   Private
 */
router.post('/sessions/:sessionId/pause', 
  authenticateToken,
  IstighfarController.pauseSession
);

/**
 * @route   POST /api/istighfar/sessions/:sessionId/resume
 * @desc    Resume istighfar session
 * @access   Private
 */
router.post('/sessions/:sessionId/resume', 
  authenticateToken,
  IstighfarController.resumeSession
);

/**
 * @route   GET /api/istighfar/sessions/:sessionId/stats
 * @desc    Get session statistics
 * @access   Private
 */
router.get('/sessions/:sessionId/stats', 
  authenticateToken,
  IstighfarController.getSessionStats
);

// Leaderboard routes
/**
 * @route   GET /api/istighfar/leaderboard
 * @desc    Get global leaderboard
 * @access   Public
 */
router.get('/leaderboard', 
  IstighfarController.getGlobalLeaderboard
);

/**
 * @route   GET /api/istighfar/leaderboard/weekly
 * @desc    Get weekly leaderboard
 * @access   Public
 */
router.get('/leaderboard/weekly', 
  IstighfarController.getWeeklyLeaderboard
);

/**
 * @route   GET /api/istighfar/leaderboard/monthly
 * @desc    Get monthly leaderboard
 * @access   Public
 */
router.get('/leaderboard/monthly', 
  IstighfarController.getMonthlyLeaderboard
);

/**
 * @route   GET /api/istighfar/leaderboard/user/:userId
 * @desc    Get user's leaderboard position
 * @access   Private
 */
router.get('/leaderboard/user/:userId', 
  authenticateToken,
  IstighfarController.getUserLeaderboardPosition
);

/**
 * @route   GET /api/istighfar/statistics
 * @desc    Get user's istighfar statistics
 * @access   Private
 */
router.get('/statistics', 
  authenticateToken,
  IstighfarController.getUserStatistics
);

/**
 * @route   GET /api/istighfar/personal-records
 * @desc    Get user's personal records
 * @access   Private
 */
router.get('/personal-records', 
  authenticateToken,
  IstighfarController.getPersonalRecords
);

/**
 * @route   GET /api/istighfar/streak-info
 * @desc    Get user's streak information
 * @access   Private
 */
router.get('/streak-info', 
  authenticateToken,
  IstighfarController.getStreakInfo
);

export default router;