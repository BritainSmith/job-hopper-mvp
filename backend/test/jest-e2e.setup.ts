import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Global setup for e2e tests
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Use a local SQLite test database for e2e tests
  const testDbPath = path.resolve(process.cwd(), 'e2e-test.db');
  process.env.DATABASE_URL = `file:${testDbPath}`;

  // Remove existing test database if it exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Create test database using Prisma
  try {
    execSync('npx prisma db push --force-reset --accept-data-loss', {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: `file:${testDbPath}`,
        NODE_ENV: 'test',
      },
      cwd: process.cwd(),
    });

    console.log('✅ E2E test database created successfully');
  } catch (error) {
    console.error('❌ Error setting up e2e test database:', error);
    // Don't throw error, just log it
  }
});

// Global teardown for e2e tests
afterAll(() => {
  // Clean up test database
  const testDbPath = path.resolve(process.cwd(), 'e2e-test.db');
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
      console.log('✅ E2E test database cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up e2e test database:', error);
    }
  }
});
