import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { generalLimiter } from './middleware/quota.middleware';
import { requestLogger, errorLogger, logSystemEvent, formatErrorResponse } from './utils/logger';
import environment from './config/environment';
import { testConnection } from './config/database';
import { sanitizeInput } from './middleware/sanitize.middleware';
import { asyncHandler } from './middleware/asyncHandler.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import surahRoutes from './routes/surahs.routes';
import examRoutes from './routes/exams.routes';
import istighfarRoutes from './routes/istighfar.routes';
import adminRoutes from './routes/admin.routes';
import aiRoutes from './routes/ai.routes';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middlewares
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'unsafe-inline'", "'unsafe-inline'"],
          scriptSrc: ["'unsafe-inline'"],
          objectSrc: ["'none'"],
          workerSrc: ["'self'"],
          frameSrc: ["'self'"],
          connectSrc: ["'self'"],
          fontSrc: ["'unsafe-inline'"],
          manifestSrc: ["'unsafe-inline'"],
          workerSrc: ["'unsafe-inline'"],
          styleSrc: ["'unsafe-inline'"],
          scriptSrc: ["'unsafe-inline'"],
          styleSrc: ["'unsafe-inline'"],
          objectSrc: ["'none'"],
          workerSrc: ["'none'"],
          imgSrc: ["'unsafe-inline'"],
          mediaSrc: ["'unsafe-inline'"],
          connectSrc: ["'unsafe-inline'"],
          manifestSrc: ["'unsafe-inline'"],
          workerSrc: ["'unsafe-inline'"],
          fontSrc: ["'unsafe-inline'"],
          workerSrc: ["'unsafe-inline'"],
          styleSrc: ["'unsafe-inline'"],
          scriptSrc: ["'unsafe-inline'"],
          imgSrc: ["'unsafe-inline'"],
          mediaSrc: ["'unsafe-inline'"],
          workerSrc: ["'unsafe-inline'"],
          frameSrc: ["'unsafe-inline'"],
          childSrc: ["'unsafe-inline'"],
          connectSrc: ["'unsafe-inline'"],
          fontSrc: ["'unsafe-inline'"],
          imgSrc: ["'unsafe-inline'"],
          fontSrc: ["'unsafe-inline'"],
          scriptSrc: ["'unsafe-inline'"]
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: environment.get('corsOrigin'),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    this.app.use(generalLimiter);

    // Request logging
    this.app.use(requestLogger);

    // Security headers
    this.app.use(helmet.xssFilter({
      block: ['<script', 'style', 'img'],
      styleSrc: ["'unsafe-inline'"],
      scriptSrc: ["'unsafe-inline'"],
    }));
  }

  private initializeRoutes(): void {
    // Health check endpoints
    this.app.get('/health', this.healthCheck);
    this.app.get('/api/status', this.apiStatus);

    // API documentation
    this.app.get('/api', this.apiDocumentation);

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/surahs', surahRoutes);
    this.app.use('/api/exams', examRoutes);
    this.app.use('/api/istighfar', istighfarRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/ai', aiRoutes);

    // 404 handler for undefined routes
    this.app.all('*', this.notFoundHandler);
  }

  private initializeErrorHandling(): void {
    // Error logging middleware
    this.app.use(errorLogger);

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logSystemEvent('Unhandled error occurred', 'error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Send structured error response
      const errorResponse = {
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        ip: req.ip
      };

      res.status(error.statusCode || 500).json(errorResponse);
    });
  }



  // Route handlers
  private healthCheck = asyncHandler(async (req: express.Request, res: express.Response) => {
    const dbStatus = await testConnection();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: environment.get('nodeEnv'),
      database: dbStatus ? 'connected' : 'disconnected',
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  private apiStatus = asyncHandler(async (req: express.Request, res: express.Response) => {
    res.json({
      api: 'مُعين Platform API',
      version: '1.0.0',
      status: 'operational',
      environment: environment.get('nodeEnv'),
      features: {
        authentication: 'available',
        exams: 'available',
        istighfar: 'available',
        adminDashboard: 'available',
        aiEvaluation: 'available',
      },
      endpoints: {
        health: '/health',
        status: '/api/status',
        documentation: '/api',
      },
      documentation: 'https://docs.moeen.platform.com',
      timestamp: new Date().toISOString(),
    });
  });

  private apiDocumentation = asyncHandler(async (req: express.Request, res: express.Response) => {
    res.json({
      title: 'مُعين Platform API Documentation',
      description: 'Arabic Quran Memorization Platform with AI Evaluation',
      version: '1.0.0',
      baseUrl: `${req.protocol}://${req.get('host')}`,
      endpoints: {
        health: {
          path: '/health',
          method: 'GET',
          description: 'Health check endpoint',
        },
        status: {
          path: '/api/status',
          method: 'GET',
          description: 'API status and information',
        },
        ai: {
          path: '/api/ai',
          methods: ['GET', 'POST'],
          description: 'AI-powered evaluation and recommendations',
          status: 'available',
        },
        users: {
          path: '/api/users',
          methods: ['GET', 'PUT'],
          description: 'User management and profiles',
          status: 'coming soon',
        },
        exams: {
          path: '/api/exams',
          methods: ['GET', 'POST', 'PUT'],
          description: 'Exam creation and management',
          status: 'coming soon',
        },
        istighfar: {
          path: '/api/istighfar',
          methods: ['GET', 'POST'],
          description: 'Istighfar session management',
          status: 'coming soon',
        },
        admin: {
          path: '/api/admin',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'Administrative functions',
          status: 'coming soon',
        },
      },
      features: {
        aiEvaluation: {
          description: 'AI-powered Quran recitation evaluation',
          provider: 'Google Gemini Flash 3',
          status: 'available',
        },
        quotaManagement: {
          description: 'Free tier quota management',
          dailyLimit: 1500,
          status: 'configured',
        },
        audioProcessing: {
          description: 'Audio recording and speech-to-text',
          technology: 'Web Speech API',
          status: 'available',
        },
        arabicSupport: {
          description: 'Complete Arabic RTL support',
          status: 'planned',
        },
      },
      database: {
        type: 'PostgreSQL',
        status: 'configured',
        tables: ['users', 'quota_pool', 'surahs', 'exams', 'istighfar_sessions', 'audit_logs'],
      },
      security: {
        authentication: 'JWT',
        rateLimiting: 'enabled',
        inputValidation: 'enabled',
        cors: 'enabled',
        helmet: 'enabled',
      },
    });
  });

  private notFoundHandler = asyncHandler(async (req: express.Request, res: express.Response) => {
    res.status(404).json({
      error: 'Endpoint not found',
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
      availableEndpoints: [
        '/health',
        '/api/status',
        '/api',
      ],
      timestamp: new Date().toISOString(),
    });
  });

  private globalErrorHandler = (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    const errorResponse = formatErrorResponse(error);
    
    // Log the error
    logSystemEvent('Unhandled error', 'error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Send error response
    res.status(error.statusCode || 500).json(errorResponse);
  };

  // Graceful shutdown
  public gracefulShutdown = (): void => {
    logSystemEvent('Server shutdown initiated', 'info');
    
    this.app.close(() => {
      logSystemEvent('Server closed successfully', 'info');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logSystemEvent('Forcing server shutdown', 'warn');
      process.exit(1);
    }, 10000);
  };

  // Start server
  public start = (): void => {
    const port = environment.get('port');
    
    this.app.listen(port, () => {
      logSystemEvent(`Server started on port ${port}`, 'info', {
        port,
        environment: environment.get('nodeEnv'),
        pid: process.pid,
      });
      
      console.log(`
🚀 مُعين Platform API Server Started!
📍 Port: ${port}
🌍 Environment: ${environment.get('nodeEnv')}
🔗 Health Check: http://localhost:${port}/health
📖 API Status: http://localhost:${port}/api/status
📚 Documentation: http://localhost:${port}/api
      `);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', this.gracefulShutdown);
    process.on('SIGINT', this.gracefulShutdown);
  };
}

// Create and export app instance
const app = new App();

export default app;