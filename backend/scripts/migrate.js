# Database Migration Script

const { runMigrations } = require('./migrate.js');

console.log('🔄 Running database migrations...');

runMigrations()
  .then(() => {
    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  });