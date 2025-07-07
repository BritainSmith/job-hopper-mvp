const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

const testDbPath = path.join(__dirname, '..', 'test.db');

// Remove existing test database if it exists
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
  console.log('Removed existing test database');
}

try {
  // Push the schema to create the test database
  execSync('npx prisma db push --force-reset', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' }
  });
  
  console.log('Test database setup completed successfully');
} catch (error) {
  console.error('Error setting up test database:', error);
  process.exit(1);
} 