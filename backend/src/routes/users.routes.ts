import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, requireActiveUser } from '../middleware/auth.middleware';
import { validate, userUpdateSchema, paginationSchema } from '../middleware/validation.middleware';
import { requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access   Private
 */
router.get('/profile', 
  authenticateToken,
  requireActiveUser,
  UserController.getProfile
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access   Private
 */
router.put('/profile', 
  authenticateToken,
  requireActiveUser,
  validate(userUpdateSchema, 'body'),
  UserController.updateProfile
);

/**
 * @route   GET /api/users
 * @desc    Get users with pagination (admin only)
 * @access   Admin
 */
router.get('/', 
  authenticateToken,
  requireAdmin,
  validate(paginationSchema, 'query'),
  UserController.getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin only)
 * @access   Admin
 */
router.get('/:id', 
  authenticateToken,
  requireAdmin,
  UserController.getUserById
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user (admin only)
 * @access   Admin
 */
router.put('/:id', 
  authenticateToken,
  requireAdmin,
  validate(userUpdateSchema, 'body'),
  UserController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (admin only)
 * @access   Admin
 */
router.delete('/:id', 
  authenticateToken,
  requireAdmin,
  UserController.deleteUser
);

/**
 * @route   POST /api/users/change-password
 * @desc    Change user password
 * @access   Private
 */
router.post('/change-password', 
  authenticateToken,
  requireActiveUser,
  UserController.changePassword
);

/**
 * @route   POST /api/users/upload-profile-picture
 * @desc    Upload profile picture
 * @access   Private
 */
router.post('/upload-profile-picture', 
  authenticateToken,
  requireActiveUser,
  UserController.uploadProfilePicture
);

/**
 * @route   DELETE /api/users/profile-picture
 * @desc    Delete profile picture
 * @access   Private
 */
router.delete('/profile-picture', 
  authenticateToken,
  requireActiveUser,
  UserController.deleteProfilePicture
);

/**
 * @route   POST /api/users/deactivate
 * @desc    Deactivate user account
 * @access   Private
 */
router.post('/deactivate', 
  authenticateToken,
  UserController.deactivateAccount
);

/**
 * @route   POST /api/users/activate
 * @desc    Activate user account
 * @access   Admin
 */
router.post('/activate', 
  authenticateToken,
  requireAdmin,
  UserController.activateAccount
);

export default router;