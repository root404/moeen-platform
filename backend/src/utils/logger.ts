import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import environment from '../config/environment';

// Ensure logs directory exists
const logDir = path.dirname(environment.get('logFile'));
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create Winston logger
const logger = winston.createLogger({
  level: environment.get('logLevel'),
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'moeen-backend' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: environment.get('logFile'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, also log to console with a simpler format
if (!environment.get('isProduction')) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).userId,
  });

  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).userId,
    });
  });

  next();
};

// Error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).userId,
    },
  });

  next(err);
};

// Security event logging
export const securityLogger = (event: string, details: any, req?: Request) => {
  logger.warn('Security event', {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    userId: (req as any)?.userId,
  });
};

// Audit logging
export const auditLogger = (action: string, actor: string, details: any, success: boolean = true) => {
  logger.info('Audit log', {
    action,
    actor,
    details,
    success,
    timestamp: new Date().toISOString(),
  });
};

// Quota logging
export const quotaLogger = (userId: string, action: string, consumed: number, remaining: number, isPremium: boolean) => {
  logger.info('Quota usage', {
    userId,
    action,
    consumed,
    remaining,
    isPremium,
    timestamp: new Date().toISOString(),
  });
};

// AI API logging
export const aiLogger = (userId: string, action: string, details: any, success: boolean = true) => {
  logger.info('AI API call', {
    userId,
    action,
    details,
    success,
    timestamp: new Date().toISOString(),
  });
};

// Database query logging (for slow queries)
export const slowQueryLogger = (query: string, duration: number, params: any[]) => {
  logger.warn('Slow query detected', {
    query,
    duration: `${duration}ms`,
    params,
    timestamp: new Date().toISOString(),
  });
};

// User activity logging
export const activityLogger = (userId: string, activity: string, details: any) => {
  logger.info('User activity', {
    userId,
    activity,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Performance logging
export const performanceLogger = (metric: string, value: number, unit: string, details: any = {}) => {
  logger.info('Performance metric', {
    metric,
    value,
    unit,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Helper functions for structured logging
export const logUserAction = (req: Request, action: string, details: any = {}) => {
  logger.info('User action', {
    action,
    details,
    user: {
      id: (req as any).userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
    request: {
      method: req.method,
      url: req.url,
    },
    timestamp: new Date().toISOString(),
  });
};

export const logSystemEvent = (event: string, severity: 'info' | 'warn' | 'error' = 'info', details: any = {}) => {
  logger[severity]('System event', {
    event,
    details,
    timestamp: new Date().toISOString(),
  });
};

export const logAPIResponse = (req: Request, res: Response, responseTime: number) => {
  logger.info('API Response', {
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).userId,
    },
    response: {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    },
    timestamp: new Date().toISOString(),
  });
};

// Create a child logger with specific context
export const createContextLogger = (context: string) => {
  return logger.child({ context });
};

// Get log statistics
export const getLogStats = () => {
  // This could be extended to read log files and return statistics
  return {
    logLevel: logger.level,
    transports: logger.transports.length,
    context: 'moeen-backend',
  };
};

// Test logger functionality
export const testLogger = () => {
  logger.info('Test log message', { test: true });
  logger.warn('Test warning message', { test: true });
  logger.error('Test error message', { test: true });
};

export default {
  logger,
  requestLogger,
  errorLogger,
  securityLogger,
  auditLogger,
  quotaLogger,
  aiLogger,
  slowQueryLogger,
  activityLogger,
  performanceLogger,
  logUserAction,
  logSystemEvent,
  logAPIResponse,
  createContextLogger,
  getLogStats,
  testLogger,
};