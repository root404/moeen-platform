import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AuthRequest } from '../types';

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

// ValidationError interface
interface ValidationError {
  field: string;
  message: string;
}

export class ValidationError extends APIError {
  constructor(public validationErrors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

// Generic validation middleware factory
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = req[property];
    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all errors
      allowUnknown: false, // Reject unknown fields
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const validationErrors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors,
      });
    }

    // Replace the request property with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Email validation schema
export const emailSchema = Joi.string()
  .email({
    minDomainSegments: 2,
    tlds: { allow: ['com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'arpa', 'biz', 'info', 'name', 'pro', 'aero', 'coop', 'museum'] },
  })
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  });

// Password validation schema
export const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required',
  });

// User registration schema
export const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  date_of_birth: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.format': 'Date of birth must be in ISO format (YYYY-MM-DD)',
      'date.max': 'Date of birth cannot be in the future',
    }),
  country: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Country name must not exceed 100 characters',
    }),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .optional()
    .messages({
      'any.only': 'Gender must be one of: male, female, other',
    }),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-\(\)]+$/)
    .max(20)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number can only contain digits, spaces, hyphens, and parentheses',
      'string.max': 'Phone number must not exceed 20 characters',
    }),
});

// User login schema
export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

// Exam creation schema
export const examSchema = Joi.object({
  surah_id: Joi.number()
    .integer()
    .min(1)
    .max(114)
    .required()
    .messages({
      'number.base': 'Surah ID must be a number',
      'number.integer': 'Surah ID must be an integer',
      'number.min': 'Surah ID must be between 1 and 114',
      'number.max': 'Surah ID must be between 1 and 114',
      'any.required': 'Surah ID is required',
    }),
  exam_type: Joi.string()
    .valid('learning', 'final', 'istighfar')
    .required()
    .messages({
      'any.only': 'Exam type must be one of: learning, final, istighfar',
      'any.required': 'Exam type is required',
    }),
});

// Exam update schema
export const examUpdateSchema = Joi.object({
  surah_id: Joi.number()
    .integer()
    .min(1)
    .max(114)
    .optional(),
  exam_type: Joi.string()
    .valid('learning', 'final', 'istighfar')
    .optional(),
  score: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Score must be between 0 and 100',
      'number.max': 'Score must be between 0 and 100',
    }),
  status: Joi.string()
    .valid('pending', 'in_progress', 'completed', 'failed', 'cancelled')
    .optional(),
  duration_seconds: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Duration must be a non-negative number',
    }),
  attempts_count: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Attempts count must be a non-negative number',
    }),
});

// Istighfar session schema
export const istighfarSchema = Joi.object({
  target_repetitions: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(120)
    .messages({
      'number.min': 'Target repetitions must be at least 1',
      'number.max': 'Target repetitions must not exceed 1000',
    }),
  session_type: Joi.string()
    .valid('personal', 'competitive', 'guided')
    .default('personal')
    .messages({
      'any.only': 'Session type must be one of: personal, competitive, guided',
    }),
  notes: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 500 characters',
    }),
});

// User update schema
export const userUpdateSchema = Joi.object({
  email: emailSchema.optional(),
  date_of_birth: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.format': 'Date of birth must be in ISO format (YYYY-MM-DD)',
      'date.max': 'Date of birth cannot be in the future',
    }),
  country: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Country name must not exceed 100 characters',
    }),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .optional()
    .messages({
      'any.only': 'Gender must be one of: male, female, other',
    }),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-\(\)]+$/)
    .max(20)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number can only contain digits, spaces, hyphens, and parentheses',
      'string.max': 'Phone number must not exceed 20 characters',
    }),
  subscription_type: Joi.string()
    .valid('free', 'premium')
    .optional()
    .messages({
      'any.only': 'Subscription type must be either free or premium',
    }),
  role: Joi.string()
    .valid('user', 'admin', 'moderator')
    .optional()
    .messages({
      'any.only': 'Role must be one of: user, admin, moderator',
    }),
});

// Password change schema
export const passwordChangeSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
    }),
  new_password: passwordSchema,
});

// Password reset request schema
export const passwordResetRequestSchema = Joi.object({
  email: emailSchema,
});

// Password reset confirm schema
export const passwordResetConfirmSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required',
    }),
  new_password: passwordSchema,
});

// ID parameter validation schema
export const idParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Invalid ID format',
      'any.required': 'ID is required',
    }),
});

// Surah ID parameter validation schema
export const surahIdParamSchema = Joi.object({
  surahId: Joi.number()
    .integer()
    .min(1)
    .max(114)
    .required()
    .messages({
      'number.base': 'Surah ID must be a number',
      'number.integer': 'Surah ID must be an integer',
      'number.min': 'Surah ID must be between 1 and 114',
      'number.max': 'Surah ID must be between 1 and 114',
      'any.required': 'Surah ID is required',
    }),
});

// Pagination schema
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be a positive integer',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
  sort_by: Joi.string()
    .optional()
    .messages({
      'string.base': 'Sort field must be a string',
    }),
  sort_order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc',
    }),
});

// File upload validation
export const validateAudioUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No audio file provided',
      code: 'NO_FILE',
    });
  }

  const file = req.file;
  const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/mpeg', 'audio/webm'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({
      error: 'Invalid file type. Allowed types: WAV, MP3, OGG',
      code: 'INVALID_FILE_TYPE',
    });
  }

  if (file.size > maxSize) {
    return res.status(400).json({
      error: 'File size too large. Maximum size is 10MB',
      code: 'FILE_TOO_LARGE',
    });
  }

  next();
};

// Sanitize input to prevent XSS
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// Export all validation schemas
export default {
  validate,
  registerSchema,
  loginSchema,
  examSchema,
  examUpdateSchema,
  istighfarSchema,
  userUpdateSchema,
  passwordChangeSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  idParamSchema,
  surahIdParamSchema,
  paginationSchema,
  validateAudioUpload,
  sanitizeInput,
  emailSchema,
  passwordSchema,
};