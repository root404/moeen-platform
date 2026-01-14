import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

const getDatabaseConfig = (): DatabaseConfig => {
  const isProduction = process.env['NODE_ENV'] === 'production';
  
  // Try to use DATABASE_URL first (common in production environments)
  if (process.env['DATABASE_URL']) {
    try {
      const dbUrl = new URL(process.env['DATABASE_URL']);
      return {
        host: dbUrl.hostname || 'localhost',
        port: parseInt(dbUrl.port) || 5432,
        database: dbUrl.pathname?.substring(1) || 'moeen_platform',
        user: dbUrl.username || process.env['DB_USER'] || 'postgres',
        password: dbUrl.password || process.env['DB_PASSWORD'] || '',
        ssl: isProduction,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      };
    } catch (error) {
      console.warn('Invalid DATABASE_URL, falling back to individual config values');
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432', 10),
    database: process.env['DB_NAME'] || 'moeen_platform',
    user: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || '',
    ssl: isProduction,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
};

class Database {
  private pool: Pool;
  private static instance: Database;

  private   constructor() {
    const config = getDatabaseConfig();
    
    this.pool = new Pool(config);

    // Handle pool errors
    this.pool.on('error', (error) => {
      console.error('Database pool error:', error);
    });

    // Log connection info in development
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`Database connected to: ${config.host}:${config.port}/${config.database}`);
    }
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  // Test database connection
  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  // Execute a query with parameters
  public async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries in development
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.log('Slow query:', { text, duration, rows: result.rowCount });
      }
      
      return result.rows;
    } catch (error) {
      console.error('Database query error:', { text, params, error });
      throw error;
    }
  }

  // Execute a transaction
  public async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Close database connection pool
  public async close(): Promise<void> {
    await this.pool.end();
    console.log('Database connection pool closed');
  }

  // Get pool statistics
  public getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}

// Export singleton instance
export const database = Database.getInstance();

// Export types
export type { DatabaseConfig };

// Export convenience methods
export const query = <T = any>(text: string, params?: any[]): Promise<T[]> => 
  database.query<T>(text, params);

export const transaction = <T>(callback: (client: any) => Promise<T>): Promise<T> => 
  database.transaction(callback);

export const testConnection = (): Promise<boolean> => 
  database.testConnection();

export const closeDatabase = (): Promise<void> => 
  database.close();

export const getPoolStats = () => 
  database.getPoolStats();