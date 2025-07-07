import { IntegrationTestSetup } from './integration-test.setup';
import { execSync } from 'child_process';
import * as fs from 'fs';

// Global setup - runs once before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'file:./test.db';

  // Set up test database
  const testDbPath = './test.db';

  // Remove existing test database if it exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Create test database using Prisma
  try {
    execSync('npx prisma db push --force-reset', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    });
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }

  // Create the testing app
  await IntegrationTestSetup.createTestingApp();
});

// Global teardown - runs once after all tests
afterAll(async () => {
  await IntegrationTestSetup.closeApp();
});

// Clean up database between tests
beforeEach(async () => {
  await IntegrationTestSetup.cleanupDatabase();
});
