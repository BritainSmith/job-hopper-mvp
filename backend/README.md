# Job Hopper Backend

## Integration Test Infrastructure

Integration tests are located in `src/test/` and use a dedicated SQLite test database (`test.db`).

- To run all integration tests:
  ```bash
  npm run test:integration
  ```
- To run a specific integration test file:
  ```bash
  npm run test:integration -- src/test/job-repository.integration-spec.ts
  ```
- Test database is automatically created and cleaned up for each test run.
- See `src/test/README.md` for detailed documentation and best practices. 