# Integration Test Infrastructure

This directory contains the integration test infrastructure for the Job Hopper backend application.

## Overview

Integration tests verify that different parts of the application work together correctly, including:
- Database operations
- Service layer interactions
- Repository layer functionality
- API endpoints (when combined with HTTP testing)

## Structure

```
src/test/
├── integration-test.module.ts      # Test module configuration
├── integration-test.setup.ts       # Test setup and teardown utilities
├── jest-integration.setup.ts       # Jest global setup
├── test-utils.ts                   # Test data utilities
├── job-repository.integration-spec.ts  # Example integration test
└── README.md                       # This file
```

## Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration -- --watch

# Run specific integration test file
npm run test:integration -- job-repository.integration-spec.ts
```

## Test Database

Integration tests use a separate test database (`test.db`) to avoid affecting development data. The database is:
- Created automatically when tests start
- Cleaned between each test
- Destroyed when tests complete

## Writing Integration Tests

### Basic Structure

```typescript
import { IntegrationTestSetup } from './integration-test.setup';
import { TestUtils } from './test-utils';

describe('YourService Integration Tests', () => {
  let service: YourService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const context = await IntegrationTestSetup.createTestingApp();
    service = context.module.get<YourService>(YourService);
    prisma = context.prisma;
  });

  afterAll(async () => {
    await IntegrationTestSetup.closeApp();
  });

  beforeEach(async () => {
    await IntegrationTestSetup.cleanupDatabase();
  });

  it('should perform integration test', async () => {
    // Arrange
    const testData = TestUtils.generateMockJobData();

    // Act
    const result = await service.method(testData);

    // Assert
    expect(result).toBeDefined();
  });
});
```

### Using Test Utilities

```typescript
// Create test data
const jobData = TestUtils.generateMockJobData({
  title: 'Custom Title',
  company: 'Custom Company'
});

// Create job in database
const job = await TestUtils.createTestJob(prisma, jobData);

// Create multiple jobs
const jobs = await TestUtils.createMultipleTestJobs(prisma, 5);

// Create job with company
const { job, company } = await TestUtils.createTestJobWithCompany(
  prisma, 
  jobData, 
  companyData
);
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data between tests
3. **Realistic Data**: Use realistic test data that matches production scenarios
4. **Error Testing**: Test both success and error scenarios
5. **Database State**: Verify database state after operations

## Configuration

Integration tests use the following configuration:
- **Database**: SQLite test database (`test.db`)
- **Environment**: `NODE_ENV=test`
- **Timeout**: 30 seconds per test
- **Coverage**: Excludes test files from coverage reports

## Adding New Integration Tests

1. Create a new test file with `.integration-spec.ts` suffix
2. Import the necessary test utilities
3. Follow the basic structure shown above
4. Use `TestUtils` for creating test data
5. Test both success and error scenarios
6. Verify database state where appropriate

## Troubleshooting

### Database Connection Issues
- Ensure the test database file is writable
- Check that Prisma migrations are up to date
- Verify environment variables are set correctly

### Test Timeouts
- Increase timeout in `jest-integration.json` if needed
- Check for long-running database operations
- Ensure proper cleanup in `afterAll` hooks

### Memory Issues
- Ensure proper cleanup of test data
- Check for memory leaks in service implementations
- Monitor database connection pooling 