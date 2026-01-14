import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import environment from '../config/environment';
import { AuthRequest } from '../types';
import { query } from '../config/database';

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

export class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.statusCode = 429;
    this.name = 'RateLimitError';
  }
}

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: environment.get('rateLimitWindow') * 60 * 1000, // Convert minutes to milliseconds
  max: environment.get('rateLimitMaxRequests'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: environment.get('rateLimitWindow') * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP address for rate limiting
  keyGenerator: (req: Request) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  // Custom handler for exceeded requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: environment.get('rateLimitWindow') * 60,
    });
  },
  // Skip successful requests from counting towards the limit
  skipSuccessfulRequests: false,
  // Skip failed requests from counting towards the limit
  skipFailedRequests: false,
});

// Strict rate limiter for sensitive endpoints
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 requests
  message: {
    error: 'Too many attempts, please try again later.',
    code: 'STRICT_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiter (for login attempts)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use email + IP combination for login attempts
  keyGenerator: (req: Request) => {
    const email = (req.body as any)?.email || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `auth:${ip}:${email}`;
  },
});

// Registration rate limiter
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    error: 'Too many registration attempts, please try again later.',
    code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `registration:${ip}`;
  },
});

// AI API rate limiter (based on user subscription)
export const aiApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // Default max, will be dynamically adjusted based on user
  message: {
    error: 'AI API rate limit exceeded, please wait before making another request.',
    code: 'AI_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthRequest) => {
    const userId = req.userId || req.ip || 'unknown';
    return `ai:${userId}`;
  },
  // Dynamic limit based on user subscription
  keyGenerator: async (req: AuthRequest) => {
    const userId = req.userId;
    if (!userId) {
      return req.ip || 'unknown';
    }

    try {
      // Get user subscription type from database
      const users = await query(
        'SELECT subscription_type FROM users WHERE id = $1',
        [userId]
      );
      
      const user = users[0];
      if (user && user.subscription_type === 'premium') {
        // Higher limit for premium users
        req.aiApiLimit = 50; // 50 requests per minute for premium
      } else {
        req.aiApiLimit = 10; // 10 requests per minute for free users
      }
    } catch (error) {
      // Default to free user limit if database query fails
      req.aiApiLimit = 10;
    }
    
    return `ai:${userId}`;
  },
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 uploads per 5 minutes
  message: {
    error: 'Too many file uploads, please try again later.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: 5 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthRequest) => {
    const userId = req.userId || req.ip || 'unknown';
    return `upload:${userId}`;
  },
});

// Middleware to check and update quota for AI calls
export const checkQuotaLimit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required for AI calls',
        code: 'AUTH_REQUIRED',
      });
    }

    // Get user subscription and quota info
    const users = await query(
      'SELECT u.subscription_type FROM users u WHERE u.id = $1',
      [userId]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const user = users[0];
    const isPremium = user.subscription_type === 'premium';

    // Check quota pool for free users
    if (!isPremium) {
      const quotaPool = await query(
        'SELECT free_pool_remaining_calls FROM quota_pool WHERE pool_date = CURRENT_DATE'
      );

      if (!quotaPool || quotaPool.length === 0) {
        return res.status(503).json({
          error: 'Quota pool not available',
          code: 'QUOTA_POOL_UNAVAILABLE',
        });
      }

      const remainingCalls = quotaPool[0].free_pool_remaining_calls;
      if (remainingCalls <= 0) {
        return res.status(429).json({
          error: 'Daily AI quota exceeded. Please try again tomorrow or upgrade to premium.',
          code: 'QUOTA_EXCEEDED',
          retryAfter: calculateRetryTime(),
        });
      }
    }

    // Log quota consumption for tracking
    await query(
      'INSERT INTO audit_logs (action_type, actor, details, success) VALUES ($1, $2, $3, $4)',
      [
        'quota_check',
        userId,
        {
          isPremium,
          action: 'ai_call_attempt',
          timestamp: new Date().toISOString(),
        },
        true
      ]
    );

    next();
  } catch (error) {
    console.error('Quota check error:', error);
    res.status(500).json({
      error: 'Failed to check quota',
      code: 'QUOTA_CHECK_FAILED',
    });
  }
};

// Update quota consumption after successful AI call
export const updateQuotaConsumption = async (userId: string, consumed: number = 1) => {
  try {
    // Get user subscription type
    const users = await query(
      'SELECT subscription_type FROM users WHERE id = $1',
      [userId]
    );

    if (!users || users.length === 0) {
      return false;
    }

    const user = users[0];
    const isPremium = user.subscription_type === 'premium';

    // Update quota pool for free users
    if (!isPremium) {
      await query(
        'UPDATE quota_pool SET free_pool_remaining_calls = free_pool_remaining_calls - $1, total_consumed = total_consumed + $1 WHERE pool_date = CURRENT_DATE',
        [consumed]
      );
    }

    // Log quota consumption
    await query(
      'INSERT INTO audit_logs (action_type, actor, details, success) VALUES ($1, $2, $3, $4)',
      [
        'quota_consumption',
        userId,
        {
          consumed,
          isPremium,
          timestamp: new Date().toISOString(),
        },
        true
      ]
    );

    return true;
  } catch (error) {
    console.error('Quota update error:', error);
    return false;
  }
};

// Helper function to calculate retry time based on quota reset schedule
const calculateRetryTime = (): number => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
};

// Get current quota status for a user
export const getQuotaStatus = async (userId: string) => {
  try {
    const users = await query(
      'SELECT subscription_type FROM users WHERE id = $1',
      [userId]
    );

    if (!users || users.length === 0) {
      return null;
    }

    const user = users[0];
    const isPremium = user.subscription_type === 'premium';

    if (isPremium) {
      return {
        isAvailable: true,
        remainingCalls: 'unlimited',
        dailyLimit: 'unlimited',
        resetTime: null,
        userType: 'premium',
      };
    }

    const quotaPool = await query(
      'SELECT free_pool_remaining_calls FROM quota_pool WHERE pool_date = CURRENT_DATE'
    );

    if (!quotaPool || quotaPool.length === 0) {
      return null;
    }

    const remainingCalls = quotaPool[0].free_pool_remaining_calls;
    const freeQuotaDaily = environment.get('freeQuotaDaily');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return {
      isAvailable: remainingCalls > 0,
      remainingCalls,
      dailyLimit: freeQuotaDaily,
      resetTime: tomorrow,
      userType: 'free',
    };
  } catch (error) {
    console.error('Get quota status error:', error);
    return null;
  }
};

// Rate limit middleware with quota checking
export const quotaAwareLimiter = [
  checkQuotaLimit,
  aiApiLimiter,
];

export default {
  generalLimiter,
  strictLimiter,
  authLimiter,
  registrationLimiter,
  aiApiLimiter,
  uploadLimiter,
  checkQuotaLimit,
  updateQuotaConsumption,
  getQuotaStatus,
  quotaAwareLimiter,
};