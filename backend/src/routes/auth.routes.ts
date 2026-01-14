import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate, registerSchema, loginSchema } from '../middleware/validation.middleware';
import { authLimiter, registrationLimiter } from '../middleware/quota.middleware';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access   Public
 */
router.post('/register', 
  registrationLimiter,
  validate(registerSchema, 'body'),
  AuthController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access   Public
 */
router.post('/login', 
  authLimiter,
  validate(loginSchema, 'body'),
  AuthController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access   Public
 */
router.post('/refresh', 
  AuthController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user / invalidate token
 * @access   Private
 */
router.post('/logout', 
  authenticateToken,
  AuthController.logout
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access   Public
 */
router.post('/forgot-password', 
  AuthController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access   Public
 */
router.post('/reset-password', 
  AuthController.resetPassword
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access   Private
 */
router.post('/change-password', 
  authenticateToken,
  AuthController.changePassword
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email
 * @access   Public
 */
router.post('/verify-email', 
  AuthController.verifyEmail
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access   Private
 */
router.get('/me', 
  authenticateToken,
  AuthController.getCurrentUser
);

/**
 * @route   POST /api/auth/check-token
 * @desc    Check if token is valid
 * @access   Public
 */
router.post('/check-token', 
  AuthController.checkToken
);

export default router;