import { Response, NextFunction } from 'express';
import { AuthRequest, LoginRequest, RegisterRequest, JWTPayload } from '../types';
import { UserService } from '../models/User.model';
import { AuditLogService } from '../models/AuditLog.model';
import { 
  generateToken, 
  verifyToken, 
  generateAccessToken, 
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../utils/helpers';
import { 
  sendSuccess, 
  sendError, 
  asyncHandler, 
  hashPassword,
  comparePassword,
  validateUUID
} from '../utils/errors';
import environment from '../config/environment';
import { auditLogger, securityLogger, activityLogger } from '../utils/logger';

export class AuthController {
  /**
   * Register a new user
   */
  static register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, date_of_birth, country, gender, phone }: RegisterRequest = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      // Create user
      const user = await UserService.createUser({
        email,
        password,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
        country,
        gender,
        phone
      });

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        subscriptionType: user.subscription_type
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        tokenId: user.id // Simple token ID, can be enhanced
      });

      // Log successful registration
      await AuditLogService.logAuthEvent('register', user.id, true, {
        ip: ip,
        userAgent
      }, ip, userAgent);

      activityLogger('User registered successfully', user.id, {
        email: user.email,
        role: user.role
      });

      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          subscription_type: user.subscription_type,
          email_verified: user.email_verified,
          created_at: user.created_at
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: environment.get('jwtExpire'),
          tokenType: 'Bearer'
        }
      }, 'User registered successfully', {
        requiresEmailVerification: !user.email_verified
      });

    } catch (error: any) {
      // Log failed registration attempt
      await AuditLogService.logAuthEvent('register', email, false, {
        error: error.message,
        ip,
        userAgent
      }, ip, userAgent);

      securityLogger('Registration attempt failed', email, {
        error: error.message,
        ip,
        userAgent
      });

      sendError(res, error);
    }
  });

  /**
   * Authenticate user & get token
   */
  static login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password }: LoginRequest = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      // Authenticate user
      const user = await UserService.authenticateUser(email, password);

      if (!user) {
        // Log failed login attempt
        await AuditLogService.logAuthEvent('login', email, false, {
          error: 'Invalid credentials',
          ip,
          userAgent
        }, ip, userAgent);

        securityLogger('Login attempt failed - invalid credentials', email, {
          ip,
          userAgent
        });

        return sendError(res, {
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }, 401);
      }

      // Check if user is active
      if (!user.is_active) {
        await AuditLogService.logAuthEvent('login', user.id, false, {
          error: 'Account deactivated',
          ip,
          userAgent
        }, ip, userAgent);

        securityLogger('Login attempt failed - account deactivated', user.id, {
          ip,
          userAgent
        });

        return sendError(res, {
          message: 'Account has been deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        }, 401);
      }

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        subscriptionType: user.subscription_type
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
        tokenId: user.id
      });

      // Log successful login
      await AuditLogService.logAuthEvent('login', user.id, true, {
        ip,
        userAgent
      }, ip, userAgent);

      activityLogger('User logged in successfully', user.id, {
        email: user.email,
        ip
      });

      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          subscription_type: user.subscription_type,
          email_verified: user.email_verified,
          last_active: user.last_active
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: environment.get('jwtExpire'),
          tokenType: 'Bearer'
        }
      }, 'Login successful');

    } catch (error: any) {
      // Log failed login attempt
      await AuditLogService.logAuthEvent('login', email, false, {
        error: error.message,
        ip,
        userAgent
      }, ip, userAgent);

      sendError(res, error);
    }
  });

  /**
   * Refresh access token
   */
  static refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { refreshToken } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      if (!refreshToken) {
        return sendError(res, {
          message: 'Refresh token is required',
          code: 'REFRESH_TOKEN_REQUIRED'
        }, 400);
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken) as any;
      
      if (!decoded || !decoded.userId) {
        securityLogger('Invalid refresh token attempt', 'anonymous', {
          ip,
          userAgent
        });

        return sendError(res, {
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        }, 401);
      }

      // Get user to ensure still active
      const user = await UserService.getUserById(decoded.userId);
      
      if (!user || !user.is_active) {
        securityLogger('Refresh token attempt for inactive/deleted user', decoded.userId, {
          ip,
          userAgent
        });

        return sendError(res, {
          message: 'User not found or inactive',
          code: 'USER_INACTIVE'
        }, 401);
      }

      // Generate new access token
      const newAccessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        subscriptionType: user.subscription_type
      });

      // Generate new refresh token
      const newRefreshToken = generateRefreshToken({
        userId: user.id,
        tokenId: decoded.userId + Date.now() // Add timestamp to make it unique
      });

      // Log token refresh
      await AuditLogService.logAuthEvent('refresh', user.id, true, {
        ip,
        userAgent
      }, ip, userAgent);

      sendSuccess(res, {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: environment.get('jwtExpire'),
          tokenType: 'Bearer'
        }
      }, 'Token refreshed successfully');

    } catch (error: any) {
      securityLogger('Token refresh failed', 'anonymous', {
        error: error.message,
        ip,
        userAgent
      });

      sendError(res, {
        message: 'Failed to refresh token',
        code: 'TOKEN_REFRESH_FAILED'
      }, 401);
    }
  });

  /**
   * Logout user / invalidate token
   */
  static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      if (!userId) {
        return sendError(res, {
          message: 'No active session found',
          code: 'NO_ACTIVE_SESSION'
        }, 400);
      }

      // Update user's last active timestamp
      await UserService.updateLastActive(userId);

      // Log logout
      await AuditLogService.logAuthEvent('logout', userId, true, {
        ip,
        userAgent
      }, ip, userAgent);

      activityLogger('User logged out successfully', userId, {
        ip
      });

      sendSuccess(res, null, 'Logout successful');

    } catch (error: any) {
      await AuditLogService.logAuthEvent('logout', userId || 'unknown', false, {
        error: error.message,
        ip,
        userAgent
      }, ip, userAgent);

      sendError(res, error);
    }
  });

  /**
   * Send password reset email
   */
  static forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      if (!email) {
        return sendError(res, {
          message: 'Email is required',
          code: 'EMAIL_REQUIRED'
        }, 400);
      }

      // Check if user exists
      const user = await UserService.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal that user doesn't exist for security
        sendSuccess(res, null, 'If the email exists, a password reset link has been sent');
        return;
      }

      // Generate reset token (simplified - in production would use email service)
      const resetToken = generateToken({
        userId: user.id,
        type: 'password_reset'
      }, '1h'); // 1 hour expiry

      // Log password reset request
      await AuditLogService.logAuthEvent('forgot_password', user.id, true, {
        email,
        ip,
        userAgent
      }, ip, userAgent);

      // TODO: Send actual email here
      activityLogger('Password reset requested', user.id, {
        email
      });

      sendSuccess(res, {
        // In development, return the token for testing
        resetToken: environment.get('isDevelopment') ? resetToken : undefined
      }, 'If the email exists, a password reset link has been sent');

    } catch (error: any) {
      sendError(res, error);
    }
  });

  /**
   * Reset password with token
   */
  static resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token, newPassword } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      if (!token || !newPassword) {
        return sendError(res, {
          message: 'Token and new password are required',
          code: 'CREDENTIALS_REQUIRED'
        }, 400);
      }

      // Verify reset token
      const decoded = verifyToken(token) as any;
      
      if (!decoded || decoded.type !== 'password_reset' || !decoded.userId) {
        securityLogger('Invalid password reset token attempt', 'anonymous', {
          ip,
          userAgent
        });

        return sendError(res, {
          message: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        }, 400);
      }

      // Update user password
      await UserService.changePassword(decoded.userId, '', newPassword);

      // Log password reset
      await AuditLogService.logAuthEvent('reset_password', decoded.userId, true, {
        ip,
        userAgent
      }, ip, userAgent);

      activityLogger('Password reset successfully', decoded.userId);

      sendSuccess(res, null, 'Password reset successfully');

    } catch (error: any) {
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
      if (!currentPassword || !newPassword) {
        return sendError(res, {
          message: 'Current password and new password are required',
          code: 'PASSWORDS_REQUIRED'
        }, 400);
      }

      // Change password
      await UserService.changePassword(userId, currentPassword, newPassword);

      // Log password change
      await AuditLogService.logAuthEvent('change_password', userId, true, {
        ip,
        userAgent
      }, ip, userAgent);

      activityLogger('Password changed successfully', userId);

      sendSuccess(res, null, 'Password changed successfully');

    } catch (error: any) {
      await AuditLogService.logAuthEvent('change_password', userId, false, {
        error: error.message,
        ip,
        userAgent
      }, ip, userAgent);

      sendError(res, error);
    }
  });

  /**
   * Verify user email
   */
  static verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    try {
      if (!token) {
        return sendError(res, {
          message: 'Verification token is required',
          code: 'TOKEN_REQUIRED'
        }, 400);
      }

      // Verify email verification token
      const decoded = verifyToken(token) as any;
      
      if (!decoded || decoded.type !== 'email_verification' || !decoded.userId) {
        securityLogger('Invalid email verification token attempt', 'anonymous', {
          ip,
          userAgent
        });

        return sendError(res, {
          message: 'Invalid or expired verification token',
          code: 'INVALID_VERIFICATION_TOKEN'
        }, 400);
      }

      // Verify user email
      await UserService.verifyEmail(decoded.userId);

      // Log email verification
      await AuditLogService.logAuthEvent('verify_email', decoded.userId, true, {
        ip,
        userAgent
      }, ip, userAgent);

      activityLogger('Email verified successfully', decoded.userId);

      sendSuccess(res, null, 'Email verified successfully');

    } catch (error: any) {
      sendError(res, error);
    }
  });

  /**
   * Get current user profile
   */
  static getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
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
        stats
      }, 'User profile retrieved successfully');

    } catch (error: any) {
      sendError(res, error);
    }
  });

  /**
   * Check if token is valid
   */
  static checkToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendSuccess(res, {
        valid: false,
        reason: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyAccessToken(token) as any;
      
      sendSuccess(res, {
        valid: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          subscriptionType: decoded.subscriptionType
        },
        expiresAt: new Date(decoded.exp * 1000)
      });

    } catch (error: any) {
      sendSuccess(res, {
        valid: false,
        reason: error.message || 'Invalid token'
      });
    }
  });
}

export default AuthController;