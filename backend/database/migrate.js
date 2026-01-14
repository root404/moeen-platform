const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'moeen_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

// Create database connection
const pool = new Pool(config);

async function runMigrations() {
  console.log('🔄 Starting database migrations...');
  
  try {
    // Connect to database
    await pool.connect();
    console.log('✅ Connected to database');

    // Read migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${migrationFiles.length} migration files`);

    // Execute each migration
    for (const file of migrationFiles) {
      console.log(`📄 Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await pool.query(sql);
        console.log(`✅ Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`❌ Migration ${file} failed:`, error.message);
        throw error;
      }
    }

    // Run seed files
    const seedsDir = path.join(__dirname, 'seeds');
    if (fs.existsSync(seedsDir)) {
      const seedFiles = fs.readdirSync(seedsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      console.log(`🌱 Found ${seedFiles.length} seed files`);

      for (const file of seedFiles) {
        console.log(`📄 Running seed: ${file}`);
        
        const filePath = path.join(seedsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        try {
          await pool.query(sql);
          console.log(`✅ Seed ${file} completed successfully`);
        } catch (error) {
          console.error(`❌ Seed ${file} failed:`, error.message);
          throw error;
        }
      }
    }

    console.log('🎉 All migrations and seeds completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Check if this file is being run directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };