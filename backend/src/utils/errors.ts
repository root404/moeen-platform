import { Response } from 'express';
import { AuthRequest, ValidationError } from '../types';

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

export class AppError extends APIError {
  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, 'BAD_REQUEST', details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', details?: any) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = 'Quota exceeded', resetTime?: Date) {
    super(message, 429, 'QUOTA_EXCEEDED', { resetTime });
    this.name = 'QuotaExceededError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

// Error response formatter
export const formatErrorResponse = (error: any) => {
  if (error instanceof AppError || error instanceof APIError) {
    return {
      error: error.message,
      code: error.code || 'INTERNAL_ERROR',
      details: error.details,
      timestamp: new Date().toISOString(),
    };
  }

  if (error.name === 'ValidationError') {
    return {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.validationErrors || error.details,
      timestamp: new Date().toISOString(),
    };
  }

  if (error.name === 'CastError') {
    return {
      error: 'Invalid data format',
      code: 'INVALID_FORMAT',
      details: { field: error.path, value: error.value },
      timestamp: new Date().toISOString(),
    };
  }

  if (error.code === '23505') { // PostgreSQL unique violation
    return {
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE',
      details: { constraint: error.constraint },
      timestamp: new Date().toISOString(),
    };
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    return {
      error: 'Referenced resource does not exist',
      code: 'FOREIGN_KEY_VIOLATION',
      details: { constraint: error.constraint },
      timestamp: new Date().toISOString(),
    };
  }

  if (error.code === '23502') { // PostgreSQL not null violation
    return {
      error: 'Required field is missing',
      code: 'REQUIRED_FIELD_MISSING',
      details: { column: error.column },
      timestamp: new Date().toISOString(),
    };
  }

  // Default error response
  return {
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    code: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'production' ? undefined : { stack: error.stack },
    timestamp: new Date().toISOString(),
  };
};

// Success response formatter
export const formatSuccessResponse = <T>(data: T, message?: string, meta?: any) => {
  const response: any = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
};

// Paginated response formatter
export const formatPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
) => {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
    ...(message && { message }),
  };
};

// Send success response
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string,
  meta?: any
) => {
  const response = formatSuccessResponse(data, message, meta);
  return res.status(statusCode).json(response);
};

// Send paginated response
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
) => {
  const response = formatPaginatedResponse(data, page, limit, total, message);
  return res.status(200).json(response);
};

// Send error response
export const sendError = (res: Response, error: any, statusCode?: number) => {
  const formattedError = formatErrorResponse(error);
  const status = statusCode || error.statusCode || 500;
  
  return res.status(status).json(formattedError);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: AuthRequest, res: Response, next: Function) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation helper
export const validateRequired = (value: any, fieldName: string) => {
  if (value === undefined || value === null || value === '') {
    throw new BadRequestError(`${fieldName} is required`);
  }
  return value;
};

// UUID validation helper
export const validateUUID = (id: string, fieldName: string = 'ID') => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new BadRequestError(`Invalid ${fieldName} format`);
  }
  return id;
};

// Email validation helper
export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new BadRequestError('Invalid email format');
  }
  return email;
};

// Password strength validation
export const validatePasswordStrength = (password: string) => {
  if (password.length < 8) {
    throw new BadRequestError('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    throw new BadRequestError('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    throw new BadRequestError('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    throw new BadRequestError('Password must contain at least one number');
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    throw new BadRequestError('Password must contain at least one special character');
  }

  return password;
};

// Sanitize string input
export const sanitizeString = (input: string, maxLength?: number) => {
  if (typeof input !== 'string') {
    throw new BadRequestError('Input must be a string');
  }

  let sanitized = input.trim();

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>'"]/g, '');

  if (maxLength && sanitized.length > maxLength) {
    throw new BadRequestError(`Input must not exceed ${maxLength} characters`);
  }

  return sanitized;
};

// Parse and validate integer
export const parseInteger = (value: any, fieldName: string, min?: number, max?: number) => {
  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    throw new BadRequestError(`${fieldName} must be a valid integer`);
  }

  if (min !== undefined && parsed < min) {
    throw new BadRequestError(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && parsed > max) {
    throw new BadRequestError(`${fieldName} must not exceed ${max}`);
  }

  return parsed;
};

// Validate date range
export const validateDateRange = (startDate: Date, endDate: Date, fieldName: string = 'Date range') => {
  if (startDate >= endDate) {
    throw new BadRequestError(`${fieldName}: Start date must be before end date`);
  }
  return { startDate, endDate };
};

// Check resource ownership
export const checkOwnership = (resource: any, userId: string, resourceType: string = 'resource') => {
  if (!resource) {
    throw new NotFoundError(resourceType);
  }

  if (resource.user_id !== userId) {
    throw new ForbiddenError(`You do not have permission to access this ${resourceType}`);
  }

  return resource;
};

// Rate limiting helper
export const checkRateLimit = (currentUsage: number, limit: number, window: string) => {
  if (currentUsage >= limit) {
    throw new RateLimitError(`Rate limit exceeded. Maximum ${limit} requests per ${window}.`);
  }
  return true;
};

// Quota checking helper
export const checkQuota = (usedQuota: number, totalQuota: number, resetTime?: Date) => {
  if (usedQuota >= totalQuota) {
    throw new QuotaExceededError(
      'Quota exceeded',
      resetTime
    );
  }
  return true;
};

export default {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  QuotaExceededError,
  DatabaseError,
  ExternalServiceError,
  formatErrorResponse,
  formatSuccessResponse,
  formatPaginatedResponse,
  sendSuccess,
  sendPaginated,
  sendError,
  asyncHandler,
  validateRequired,
  validateUUID,
  validateEmail,
  validatePasswordStrength,
  sanitizeString,
  parseInteger,
  validateDateRange,
  checkOwnership,
  checkRateLimit,
  checkQuota,
};