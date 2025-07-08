# Job Hopper Backend

## Environment Configuration

This backend requires several environment variables to be configured. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Required Environment Variables

- **`OPENAI_API_KEY`**: Your OpenAI API key for AI-powered job analysis
- **`OPENAI_BASE_URL`**: OpenAI API base URL (default: `https://api.openai.com/v1`)

### Optional Environment Variables

- **`REMOTEOK_BASE_URL`**: RemoteOK scraper base URL (default: `https://remoteok.com`)
- **`LINKEDIN_BASE_URL`**: LinkedIn scraper base URL (default: `https://linkedin.com/jobs`)
- **`DATABASE_URL`**: Database connection string (for production)

### Security Best Practices

- Never commit `.env` files to version control
- Use different API keys for development and production
- Rotate API keys regularly
- Use environment-specific `.env` files (`.env.development`, `.env.production`)

## Adding New External Services

When adding new scrapers or external services:

1. Add the base URL to your `.env` file: `NEW_SERVICE_BASE_URL=https://api.newservice.com`
2. Update `.env.example` with the new variable
3. Inject `ConfigService` in your scraper/service constructor
4. Read the URL: `this.baseUrl = this.configService.get<string>('NEW_SERVICE_BASE_URL') || 'https://default-url.com'`

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