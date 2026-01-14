# Database Seed Script

const { runSeeds } = require('../database/seed.js');

console.log('🌱 Running database seeds...');

runSeeds()
  .then(() => {
    console.log('✅ Database seeds completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  });