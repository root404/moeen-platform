import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  // Server Configuration
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;

  // Database Configuration
  databaseUrl: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;

  // JWT Configuration
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpire: string;
  jwtRefreshExpire: string;

  // AI Configuration
  geminiApiKey: string;
  geminiModel: string;

  // Quota Configuration
  freeQuotaDaily: number;
  paidQuotaMultiplier: number;

  // File Upload Configuration
  maxAudioSize: number;
  audioAllowedTypes: string[];

  // Rate Limiting
  rateLimitWindow: number;
  rateLimitMaxRequests: number;

  // Logging Configuration
  logLevel: string;
  logFile: string;

  // CORS Configuration
  corsOrigin: string;

  // Security Configuration
  bcryptRounds: number;
  sessionSecret: string;
}

class Environment {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): EnvironmentConfig {
    return {
      // Server Configuration
      port: parseInt(process.env['PORT'] || '3000', 10),
      nodeEnv: process.env['NODE_ENV'] || 'development',
      isProduction: process.env['NODE_ENV'] === 'production',
      isDevelopment: process.env['NODE_ENV'] === 'development',
      isTest: process.env['NODE_ENV'] === 'test',

      // Database Configuration
      databaseUrl: process.env['DATABASE_URL'] || '',
      dbHost: process.env['DB_HOST'] || 'localhost',
      dbPort: parseInt(process.env['DB_PORT'] || '5432', 10),
      dbName: process.env['DB_NAME'] || 'moeen_platform',
      dbUser: process.env['DB_USER'] || 'postgres',
      dbPassword: process.env['DB_PASSWORD'] || '',

      // JWT Configuration
      jwtSecret: process.env['JWT_SECRET'] || '',
      jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'] || '',
      jwtExpire: process.env['JWT_EXPIRE'] || '15m',
      jwtRefreshExpire: process.env['JWT_REFRESH_EXPIRE'] || '7d',

      // AI Configuration
      geminiApiKey: process.env['GEMINI_API_KEY'] || '',
      geminiModel: process.env['GEMINI_MODEL'] || 'gemini-1.5-flash',

      // Quota Configuration
      freeQuotaDaily: parseInt(process.env['FREE_QUOTA_DAILY'] || '1500', 10),
      paidQuotaMultiplier: parseInt(process.env['PAID_QUOTA_MULTIPLIER'] || '10', 10),

      // File Upload Configuration
      maxAudioSize: parseInt(process.env['MAX_AUDIO_SIZE'] || '10485760', 10), // 10MB
      audioAllowedTypes: (process.env['AUDIO_ALLOWED_TYPES'] || 'audio/wav,audio/mp3,audio/ogg').split(','),

      // Rate Limiting
      rateLimitWindow: parseInt(process.env['RATE_LIMIT_WINDOW'] || '15', 10), // minutes
      rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),

      // Logging Configuration
      logLevel: process.env['LOG_LEVEL'] || 'info',
      logFile: process.env['LOG_FILE'] || 'logs/app.log',

      // CORS Configuration
      corsOrigin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',

      // Security Configuration
      bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10),
      sessionSecret: process.env['SESSION_SECRET'] || '',
    };
  }

  private validateConfig(): void {
    const requiredFields = [
      'jwtSecret',
      'jwtRefreshSecret',
      'geminiApiKey',
      'sessionSecret',
    ];

    const missingFields = requiredFields.filter(
      field => !this.config[field as keyof EnvironmentConfig]
    );

    if (missingFields.length > 0) {
      if (this.config.isProduction) {
        throw new Error(`Missing required environment variables: ${missingFields.join(', ')}`);
      } else {
        console.warn(`Missing environment variables: ${missingFields.join(', ')}`);
        console.warn('Please check your .env file');
      }
    }

    // Validate numeric values
    if (this.config.port < 1 || this.config.port > 65535) {
      throw new Error('PORT must be between 1 and 65535');
    }

    if (this.config.dbPort < 1 || this.config.dbPort > 65535) {
      throw new Error('DB_PORT must be between 1 and 65535');
    }

    if (this.config.freeQuotaDaily < 0) {
      throw new Error('FREE_QUOTA_DAILY must be non-negative');
    }

    if (this.config.maxAudioSize < 0) {
      throw new Error('MAX_AUDIO_SIZE must be non-negative');
    }
  }

  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key];
  }

  public getAll(): EnvironmentConfig {
    return { ...this.config };
  }

  public isEnv(env: string): boolean {
    return this.config.nodeEnv === env;
  }

  // Convenience getters
  public getPort(): number {
    return this.config.port;
  }

  public getDatabaseConfig() {
    return {
      host: this.config.dbHost,
      port: this.config.dbPort,
      database: this.config.dbName,
      user: this.config.dbUser,
      password: this.config.dbPassword,
      ssl: this.config.isProduction,
    };
  }

  public getJwtConfig() {
    return {
      secret: this.config.jwtSecret,
      refreshSecret: this.config.jwtRefreshSecret,
      expire: this.config.jwtExpire,
      refreshExpire: this.config.jwtRefreshExpire,
    };
  }

  public getAIConfig() {
    return {
      apiKey: this.config.geminiApiKey,
      model: this.config.geminiModel,
    };
  }

  public getQuotaConfig() {
    return {
      freeQuotaDaily: this.config.freeQuotaDaily,
      paidQuotaMultiplier: this.config.paidQuotaMultiplier,
    };
  }
}

// Export singleton instance
const environment = new Environment();

export default environment;
export { EnvironmentConfig };

// Export convenience exports
export const config = environment.get.bind(environment);
export const isProduction = environment.get('isProduction');
export const isDevelopment = environment.get('isDevelopment');
export const isTest = environment.get('isTest');