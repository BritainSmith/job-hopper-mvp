import { IntegrationTestSetup } from './integration-test.setup';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Global setup - runs once before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Use a local SQLite test database
  const testDbPath = path.resolve(process.cwd(), 'test.db');
  process.env.DATABASE_URL = `file:${testDbPath}`;

  // Remove existing test database if it exists
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Create test database using Prisma
  try {
    // Use prisma db push to create the database schema
    execSync('npx prisma db push --force-reset --accept-data-loss', {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: `file:${testDbPath}`,
        NODE_ENV: 'test',
      },
      cwd: process.cwd(),
    });

    console.log('✅ Test database created successfully');
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    // Don't throw error, just log it and continue
    // The tests will fail naturally if the database isn't working
  }

  // Create the testing app
  try {
    await IntegrationTestSetup.createTestingApp();
    console.log('✅ Integration test app created successfully');
  } catch (error) {
    console.error('❌ Error creating integration test app:', error);
    throw error;
  }
});

// Global teardown - runs once after all tests
afterAll(async () => {
  try {
    await IntegrationTestSetup.closeApp();
    console.log('✅ Integration test app closed successfully');
  } catch (error) {
    console.error('❌ Error closing integration test app:', error);
  }

  // Clean up test database
  const testDbPath = path.resolve(process.cwd(), 'test.db');
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
      console.log('✅ Test database cleaned up');
    } catch (error) {
      console.error('❌ Error cleaning up test database:', error);
    }
  }
});

// Clean up database between tests
beforeEach(async () => {
  try {
    await IntegrationTestSetup.cleanupDatabase();
  } catch (error) {
    console.error('❌ Error cleaning up database between tests:', error);
    // Don't throw, just log the error
  }
});
