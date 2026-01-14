import { Response, NextFunction } from 'express';
import { AuthRequest, UserUpdateInput } from '../types';
import { UserService } from '../models/User.model';
import { AuditLogService } from '../models/AuditLog.model';
import { 
  sendSuccess, 
  sendError, 
  asyncHandler,
  validateRequired,
  validateEmail,
  validateUUID
} from '../utils/errors';
import { auditLogger, activityLogger } from '../utils/logger';
import { uploadLimiter, validateAudioUpload } from '../middleware/quota.middleware';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export class UserController {
  /**
   * Get current user profile
   */
  static getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      // Get user details
      const user = await UserService.getUserById(userId);
      
      if (!user) {
        return sendError(res, {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }, 404);
      }

      // Get user statistics
      const stats = await UserService.getUserStats(userId);

      // Log data access
      await AuditLogService.logDataAccess(userId, 'user', userId, 'read', true);

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
        stats: {
          total_exams: stats.totalExams,
          completed_exams: stats.completedExams,
          average_score: stats.averageScore,
          istighfar_sessions: stats.istighfarSessions,
          total_istighfar_time: stats.totalIstighfarTime
        }
      }, 'Profile retrieved successfully');

    } catch (error: any) {
      sendError(res, error);
    }
  });

  /**
   * Update current user profile
   */
  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const updateData: UserUpdateInput = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      // Validate user ID
      validateUUID(userId, 'User ID');

      // Remove sensitive fields that shouldn't be updated through this endpoint
      const { password_hash, role, subscription_type, is_active, email_verified, ...safeUpdateData } = updateData;

      // Update user
      const updatedUser = await UserService.updateUser(userId, safeUpdateData);

      // Log profile update
      await AuditLogService.logDataAccess(userId, 'user', userId, 'update', true, {
        updatedFields: Object.keys(safeUpdateData)
      });

      activityLogger('Profile updated successfully', userId, {
        updatedFields: Object.keys(safeUpdateData),
        ip
      });

      sendSuccess(res, {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          subscription_type: updatedUser.subscription_type,
          date_of_birth: updatedUser.date_of_birth,
          country: updatedUser.country,
          gender: updatedUser.gender,
          phone: updatedUser.phone,
          profile_picture_url: updatedUser.profile_picture_url,
          is_active: updatedUser.is_active,
          email_verified: updatedUser.email_verified,
          last_active: updatedUser.last_active
        }
      }, 'Profile updated successfully');

    } catch (error: any) {
      await AuditLogService.logDataAccess(userId, 'user', userId, 'update', false, {
        error: error.message
      });

      sendError(res, error);
    }
  });

  /**
   * Get users with pagination (admin only)
   */
  static getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', search } = req.query;
    const adminId = req.userId;

    try {
      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        search: search as string
      };

      const { users, total } = await UserService.getUsers(options);

      // Log data access
      await AuditLogService.logDataAccess(adminId, 'users', 'list', 'read', true, {
        pagination: { page, limit, total }
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
      sendError(res, error);
    }
  });

  /**
   * Get user by ID (admin only)
   */
  static getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const adminId = req.userId;

    try {
      // Validate user ID
      validateUUID(id, 'User ID');

      const user = await UserService.getUserById(id);
      
      if (!user) {
        return sendError(res, {
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        }, 404);
      }

      // Get user statistics
      const stats = await UserService.getUserStats(id);

      // Log data access
      await AuditLogService.logDataAccess(adminId, 'user', id, 'read', true);

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
      sendError(res, error);
    }
  });

  /**
   * Update user (admin only)
   */
  static updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData: UserUpdateInput = req.body;
    const adminId = req.userId;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      // Validate user ID
      validateUUID(id, 'User ID');

      const updatedUser = await UserService.updateUser(id, updateData);

      // Log admin action
      await AuditLogService.logAdminAction('update_user', adminId, id, {
        updatedFields: Object.keys(updateData),
        ip,
        userAgent
      }, ip, userAgent);

      activityLogger('User updated by admin', adminId, {
        targetUserId: id,
        updatedFields: Object.keys(updateData),
        ip
      });

      sendSuccess(res, {
        user: updatedUser
      }, 'User updated successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('update_user', adminId, id, {
        error: error.message,
        ip,
        userAgent
      }, ip, userAgent);

      sendError(res, error);
    }
  });

  /**
   * Delete user (admin only)
   */
  static deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const adminId = req.userId;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      // Validate user ID
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
        ip,
        userAgent
      }, ip, userAgent);

      activityLogger('User deleted by admin', adminId, {
        targetUserId: id,
        ip
      });

      sendSuccess(res, null, 'User deleted successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('delete_user', adminId, id, {
        error: error.message,
        ip,
        userAgent
      }, ip, userAgent);

      sendError(res, error);
    }
  });

  /**
   * Change user password
   */
  static changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      if (!currentPassword || !newPassword) {
        return sendError(res, {
          message: 'Current password and new password are required',
          code: 'PASSWORDS_REQUIRED'
        }, 400);
      }

      // Change password
      await UserService.changePassword(userId, currentPassword, newPassword);

      // Log password change
      await AuditLogService.logDataAccess(userId, 'user', userId, 'change_password', true, {
        ip,
        userAgent
      });

      activityLogger('Password changed successfully', userId, {
        ip
      });

      sendSuccess(res, null, 'Password changed successfully');

    } catch (error: any) {
      await AuditLogService.logDataAccess(userId, 'user', userId, 'change_password', false, {
        error: error.message,
        ip,
        userAgent
      });

      sendError(res, error);
    }
  });

  /**
   * Upload profile picture
   */
  static uploadProfilePicture = uploadLimiter(
    upload.single('profilePicture'),
    validateAudioUpload,
    asyncHandler(async (req: AuthRequest, res: Response) => {
      const userId = req.userId;
      const file = req.file;

      try {
        if (!userId) {
          return sendError(res, {
            message: 'User not authenticated',
            code: 'USER_NOT_AUTHENTICATED'
          }, 401);
        }

        if (!file) {
          return sendError(res, {
            message: 'No file uploaded',
            code: 'NO_FILE_UPLOADED'
          }, 400);
        }

        // In a real implementation, you would upload to a file storage service
        // For now, we'll simulate it by generating a URL
        const profilePictureUrl = `/uploads/profile-pictures/${userId}-${Date.now()}-${file.originalname}`;

        // Update user profile picture
        await UserService.updateUser(userId, { profile_picture_url: profilePictureUrl });

        // Log profile picture upload
        await AuditLogService.logDataAccess(userId, 'user', userId, 'upload_profile_picture', true, {
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype
        });

        activityLogger('Profile picture uploaded successfully', userId, {
          fileName: file.originalname,
          fileSize: file.size
        });

        sendSuccess(res, {
          profilePictureUrl
        }, 'Profile picture uploaded successfully');

      } catch (error: any) {
        await AuditLogService.logDataAccess(userId, 'user', userId, 'upload_profile_picture', false, {
          error: error.message
        });

        sendError(res, error);
      }
    })
  );

  /**
   * Delete profile picture
   */
  static deleteProfilePicture = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      // Update user to remove profile picture
      await UserService.updateUser(userId, { profile_picture_url: null });

      // Log profile picture deletion
      await AuditLogService.logDataAccess(userId, 'user', userId, 'delete_profile_picture', true);

      activityLogger('Profile picture deleted successfully', userId);

      sendSuccess(res, null, 'Profile picture deleted successfully');

    } catch (error: any) {
      await AuditLogService.logDataAccess(userId, 'user', userId, 'delete_profile_picture', false, {
        error: error.message
      });

      sendError(res, error);
    }
  });

  /**
   * Deactivate user account
   */
  static deactivateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
      if (!userId) {
        return sendError(res, {
          message: 'User not authenticated',
          code: 'USER_NOT_AUTHENTICATED'
        }, 401);
      }

      // Deactivate user
      await UserService.deactivateUser(userId);

      // Log account deactivation
      await AuditLogService.logDataAccess(userId, 'user', userId, 'deactivate', true);

      activityLogger('Account deactivated successfully', userId);

      sendSuccess(res, null, 'Account deactivated successfully');

    } catch (error: any) {
      await AuditLogService.logDataAccess(userId, 'user', userId, 'deactivate', false, {
        error: error.message
      });

      sendError(res, error);
    }
  });

  /**
   * Activate user account (admin only)
   */
  static activateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const adminId = req.userId;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      // Validate user ID
      validateUUID(id, 'User ID');

      // Activate user
      await UserService.activateUser(id);

      // Log admin action
      await AuditLogService.logAdminAction('activate_user', adminId, id, {
        ip,
        userAgent
      }, ip, userAgent);

      activityLogger('User activated by admin', adminId, {
        targetUserId: id,
        ip
      });

      sendSuccess(res, null, 'User activated successfully');

    } catch (error: any) {
      await AuditLogService.logAdminAction('activate_user', adminId, id, {
        error: error.message,
        ip,
        userAgent
      }, ip, userAgent);

      sendError(res, error);
    }
  });
}

export default UserController;