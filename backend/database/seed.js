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

async function runSeeds() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Connect to database
    await pool.connect();
    console.log('✅ Connected to database');

    // Read seed files
    const seedsDir = path.join(__dirname, 'seeds');
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${seedFiles.length} seed files`);

    // Execute each seed file
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

    console.log('🎉 All seeds completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Check if this file is being run directly
if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };