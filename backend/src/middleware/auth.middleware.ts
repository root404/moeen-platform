import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import environment from '../config/environment';
import { AuthRequest, JWTPayload } from '../types';

// Simple APIError class for deployment
class APIError extends Error {
  statusCode: number;
  code: string;
  details: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends APIError {
  constructor(message = 'Authentication required') {
    super(message);
    this.statusCode = 401;
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.statusCode = 403;
    this.name = 'AuthorizationError';
  }
}

export class TokenExpiredError extends APIError {
  constructor(message = 'Token has expired') {
    super(message);
    this.statusCode = 401;
    this.name = 'TokenExpiredError';
  }
}

// RefreshTokenPayload interface
interface RefreshTokenPayload {
  userId: string;
  type: string;
}

// JWT Token generation
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const jwtConfig = environment.getJwtConfig();
  return jwt.sign(
    payload,
    jwtConfig.secret,
    { expiresIn: jwtConfig.expire }
  );
};

export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string => {
  const jwtConfig = environment.getJwtConfig();
  return jwt.sign(
    payload,
    jwtConfig.refreshSecret,
    { expiresIn: jwtConfig.refreshExpire }
  );
};

// JWT Token verification
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const jwtConfig = environment.getJwtConfig();
    return jwt.verify(token, jwtConfig.secret) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError();
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    } else {
      throw new AuthenticationError('Token verification failed');
    }
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const jwtConfig = environment.getJwtConfig();
    return jwt.verify(token, jwtConfig.refreshSecret) as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError();
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    } else {
      throw new AuthenticationError('Refresh token verification failed');
    }
  }
};

// Express middleware for authentication
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      subscription_type: decoded.subscriptionType,
      // Add other properties if needed
    } as any;
    
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    if (error instanceof APIError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.name,
      });
    } else {
      res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
      });
    }
  }
};

// Optional authentication - doesn't throw error if no token
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        subscription_type: decoded.subscriptionType,
      } as any;
      req.userId = decoded.userId;
    }
    
    next();
  } catch (error) {
    // For optional auth, we just continue without user context
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
};

// Subscription type middleware
export const requireSubscription = (...allowedTypes: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const userSubscription = req.user.subscription_type;
    if (!allowedTypes.includes(userSubscription)) {
      return res.status(403).json({
        error: `Subscription required. Allowed types: ${allowedTypes.join(', ')}`,
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    next();
  };
};

// Admin middleware (convenience function)
export const requireAdmin = requireRole('admin');

// Admin or moderator middleware
export const requireModerator = requireRole('admin', 'moderator');

// Premium subscription middleware
export const requirePremium = requireSubscription('premium');

// Email verification middleware
export const requireEmailVerification = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({
      error: 'Email verification required',
      code: 'EMAIL_VERIFICATION_REQUIRED',
    });
  }

  next();
};

// Active user middleware
export const requireActiveUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
  }

  if (!req.user.is_active) {
    return res.status(403).json({
      error: 'Account is deactivated',
      code: 'ACCOUNT_DEACTIVATED',
    });
  }

  next();
};

// Helper function to extract user from request
export const getCurrentUser = (req: AuthRequest) => {
  return req.user;
};

// Helper function to check if user has specific role
export const hasRole = (user: any, role: string): boolean => {
  return user && user.role === role;
};

// Helper function to check if user has specific subscription
export const hasSubscription = (user: any, subscriptionType: string): boolean => {
  return user && user.subscription_type === subscriptionType;
};

// Combine multiple middleware functions
export const combineMiddleware = (...middlewares: Array<(req: AuthRequest, res: Response, next: NextFunction) => void>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const executeMiddleware = (index: number) => {
      if (index >= middlewares.length) {
        return next();
      }
      
      middlewares[index](req, res, (error?: any) => {
        if (error) {
          return next(error);
        }
        executeMiddleware(index + 1);
      });
    };
    
    executeMiddleware(0);
  };
};