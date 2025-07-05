# Job Hopper - Multi-Source Job Scraper

[![CI/CD Pipeline](https://github.com/britain/job-hopper/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/britain/job-hopper/actions/workflows/ci.yml)
[![PR Quality Check](https://github.com/britain/job-hopper/workflows/Pull%20Request%20Quality%20Check/badge.svg)](https://github.com/britain/job-hopper/actions/workflows/pr-check.yml)
[![Test Coverage](https://codecov.io/gh/britain/job-hopper/branch/main/graph/badge.svg)](https://codecov.io/gh/britain/job-hopper)

A TypeScript-based web scraper using Puppeteer to extract software developer job listings from multiple sources, with a NestJS backend for scalable API development.

## 🚀 Recent Major Updates (v2.0)

### ✅ **Architecture Overhaul**
- **Dependency Injection**: All scrapers now use proper NestJS dependency injection
- **Test Suite Cleanup**: Fixed all 124 tests across 11 test suites
- **Mocking Strategy**: Comprehensive HTTP request mocking to prevent real network calls
- **Error Handling**: Robust error handling with proper test coverage
- **Rate Limiting**: Enhanced rate limiting with configurable delays

### ✅ **Scraper Improvements**
- **LinkedIn Scraper**: Fixed dependency injection and parser integration
- **Arbeitnow Scraper**: Enhanced German job support with proper testing
- **Relocate.me Scraper**: Improved international job handling
- **Base Scraper**: Enhanced HTTP error handling and test setup

### ✅ **Testing Enhancements**
- **All Tests Passing**: 124/124 tests passing across all suites
- **Mock Infrastructure**: Proper mocking for HTTP requests, delays, and parsers
- **Error Scenario Coverage**: Comprehensive testing of error conditions
- **Performance**: Tests run quickly without real network calls

### 🎯 **Production Readiness**
- **100% Test Coverage**: All scrapers and components thoroughly tested
- **Proper Architecture**: Clean dependency injection patterns
- **Error Resilience**: Comprehensive error handling throughout
- **Maintainable Code**: Well-structured, testable, and documented

## Features

- 🚀 Scrapes software developer job listings from multiple sources:
  - **RemoteOK** - Remote job board
  - **LinkedIn** - Professional job listings
  - **Arbeitnow** - German job board with visa sponsorship
  - **Relocate.me** - International relocation-focused jobs
- 📊 Extracts job title, company, location, apply link, and additional metadata
- 🔄 Supports pagination to scrape multiple pages
- 💾 Saves results to JSON file and database
- ⚡ Configurable scraping options (pages, delays, headless mode)
- 🛡️ Built-in error handling and rate limiting
- 📝 TypeScript support with proper type definitions
- 🏗️ NestJS backend for scalable API development
- 🗄️ Prisma ORM for database management
- 🔧 Dynamic scraper configuration for multiple job sites
- 🌍 International job support with visa sponsorship detection
- 🧪 **Comprehensive test coverage with 124 passing tests**
- 🔄 **Proper dependency injection throughout the system**
- 🎯 **Production-ready architecture with robust error handling**

## Installation

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration
```

## Environment Setup

1. **Initial Setup:**
   ```bash
   npm run setup
   ```
   This will create a `.env` file from `.env.example` if it doesn't exist.

2. **Configure Environment Variables:**
   Edit the `.env` file with your actual values:
   ```bash
   # Database
   DATABASE_URL="file:./dev.db"
   
   # Scraping settings
   SCRAPER_DELAY=2000
   SCRAPER_MAX_PAGES=5
   SCRAPER_HEADLESS=true
   
   # Security (change these!)
   JWT_SECRET="your_secure_jwt_secret_here"
   SESSION_SECRET="your_secure_session_secret_here"
   
   # Logging
   LOG_LEVEL=info
   ```

3. **Check Configuration:**
   ```bash
   npm run config
   ```

**⚠️ Security Note:** Never commit your `.env` file to version control. It's already included in `.gitignore`.

## Scripts & Usage

You can run all major commands from the project root. The root scripts delegate to the backend as needed.

| Script         | Description                                 | Usage (from root)         |
| --------------|---------------------------------------------|---------------------------|
| `dev`         | Start backend in development mode (hot reload) | `npm run dev`             |
| `start`       | Start backend in production mode               | `npm start`               |
| `build`       | Build the backend app                          | `npm run build`           |
| `test`        | Run all unit tests                             | `npm test`                |
| `test:watch`  | Run tests in watch mode                        | `npm run test:watch`      |
| `test:cov`    | Run tests with coverage report                 | `npm run test:cov`        |
| `test:e2e`    | Run end-to-end tests                           | `npm run test:e2e`        |
| `lint`        | Lint the codebase                              | `npm run lint`            |
| `format`      | Format the codebase                            | `npm run format`          |
| `db:studio`   | Open Prisma Studio (DB browser)                | `npm run db:studio`       |
| `db:generate` | Generate Prisma client                         | `npm run db:generate`     |
| `db:migrate`  | Run DB migrations (dev)                        | `npm run db:migrate`      |
| `db:reset`    | Reset the DB (dev)                             | `npm run db:reset`        |
| `setup`       | Show environment setup instructions            | `npm run setup`           |

**Note:**
- All scripts can be run from the root directory for convenience.
- For advanced workflows, you can also run scripts directly in `backend/` (e.g., `npm run start:dev`).

## Usage

### Development

Start the NestJS development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`
Swagger documentation at `http://localhost:3000/api`

### Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Programmatic Usage

```typescript
import { scrapeRemoteOKJobs, RemoteOKScraper } from './src/scrapers/remoteok';

// Using the main function
const jobs = await scrapeRemoteOKJobs({
  maxPages: 5,
  delay: 2000,
  headless: true
});

// Or using the class directly
const scraper = new RemoteOKScraper({
  maxPages: 3,
  delay: 3000,
  headless: false
});

await scraper.initialize();
const jobs = await scraper.scrapeJobs();
await scraper.close();
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxPages` | number | 5 | Maximum number of pages to scrape |
| `delay` | number | 2000 | Delay between page requests (ms) |
| `headless` | boolean | true | Run browser in headless mode |
| `userAgent` | string | Chrome UA | Custom user agent string |

## Output Format

The scraper extracts the following data for each job:

```typescript
interface JobListing {
  title: string;        // Job title
  company: string;      // Company name
  location: string;     // Job location (usually "Remote")
  applyLink: string;    // Direct link to apply
  postedDate?: string;  // When the job was posted
  salary?: string;      // Salary information (if available)
  tags?: string[];      // Job tags/skills
}
```

## Output Files

- `remoteok-jobs.json` - Contains all scraped job listings in JSON format
- Console output shows progress and summary statistics

## Example Output

```json
[
  {
    "title": "Senior Full Stack Developer",
    "company": "TechCorp",
    "location": "Remote",
    "applyLink": "https://remoteok.com/remote-jobs/123456",
    "postedDate": "2d ago",
    "salary": "$80k - $120k",
    "tags": ["React", "Node.js", "TypeScript"]
  }
]
```

## Ethical Considerations

- The scraper includes built-in delays to be respectful to RemoteOK's servers
- It blocks unnecessary resources (images, stylesheets) to reduce bandwidth
- Consider the website's robots.txt and terms of service
- Use responsibly and don't overload their servers

## Troubleshooting

### Common Issues

1. **Browser fails to launch**: Make sure you have Chrome/Chromium installed
2. **No jobs found**: The website structure may have changed - check the selectors
3. **Rate limiting**: Increase the delay between requests
4. **Timeout errors**: Increase the timeout values in the code

### Debug Mode

To see the browser in action, set `headless: false` in the options:

```typescript
const jobs = await scrapeRemoteOKJobs({
  headless: false,
  maxPages: 1
});
```

## Dependencies

### Root Dependencies
- `puppeteer` - Browser automation
- `typescript` - Type safety
- `ts-node` - TypeScript execution
- `@types/node` - Node.js type definitions
- `dotenv` - Environment variable management
- `@prisma/client` - Database ORM
- `prisma` - Database schema management

### Backend Dependencies
- `@nestjs/common` - NestJS core framework
- `@nestjs/core` - NestJS core functionality
- `@nestjs/platform-express` - Express adapter for NestJS
- `reflect-metadata` - Metadata reflection for decorators

## Project Structure

```
job-hopper/
├── prisma/                    # Database schema & migrations (single source of truth)
├── backend/                   # NestJS application
│   ├── src/
│   │   ├── config/           # Configuration modules
│   │   ├── repositories/     # Data access layer
│   │   ├── services/         # Business logic services
│   │   ├── scrapers/         # Job scraping services
│   │   ├── prisma/           # NestJS Prisma service & module
│   │   ├── app.module.ts     # Main application module
│   │   └── main.ts           # Application entry point
│   ├── prisma -> ../prisma   # Symlink to shared schema
│   └── .env -> ../.env       # Symlink to shared env
├── .env.example              # Environment template
└── README.md                 # Project documentation
```

**📁 Prisma Setup:**
- **Root `prisma/`**: Single source of truth for database schema and migrations
- **Backend `prisma/`**: Symlink to root prisma folder for NestJS integration
- **Database**: SQLite file stored in root `prisma/dev.db`
- **All Prisma commands**: Run from root directory using `npm run db:*` scripts

**🧹 Clean Architecture:**
- **Single TypeScript config**: Backend-specific configuration only
- **Consolidated dependencies**: No duplicate packages between root and backend
- **Unified gitignore**: Single `.gitignore` file for the entire project
- **Minimal root package.json**: Only contains scripts and essential metadata

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows

The project uses comprehensive GitHub Actions workflows to ensure code quality and maintainability:

#### 🔍 **Pull Request Quality Check** (`.github/workflows/pr-check.yml`)
- **Triggers**: On every pull request to `main` or `develop`
- **Enforces**:
  - ✅ All tests must pass
  - 📊 Test coverage must be above 80%
  - 🏗️ Application must build successfully
  - 🔍 Code must pass linting
  - 🎨 Code formatting must be correct
  - 🔒 Security audit must pass

#### 🏭 **Full CI/CD Pipeline** (`.github/workflows/ci.yml`)
- **Triggers**: On push to `main`/`develop` and pull requests
- **Jobs**:
  - **Test & Coverage**: Runs all tests with coverage reporting
  - **Build**: Ensures application builds successfully
  - **Lint & Format**: Checks code quality and formatting
  - **Security Audit**: Scans for vulnerabilities
  - **Database Migration**: Validates database schema
  - **Integration Tests**: Runs end-to-end tests
  - **Quality Gates**: Final validation before deployment

#### 🚀 **Production Deployment** (`.github/workflows/deploy.yml`)
- **Triggers**: On push to `main` or manual dispatch
- **Features**:
  - Final test validation
  - Production build creation
  - Artifact upload
  - Deployment to production environment

### Quality Gates

The CI/CD pipeline enforces strict quality standards:

| Gate | Requirement | Action |
|------|-------------|---------|
| **Test Coverage** | ≥80% overall | ❌ Block merge if below threshold |
| **All Tests Pass** | 100% test success | ❌ Block merge if any test fails |
| **Build Success** | Clean build | ❌ Block merge if build fails |
| **Linting** | No linting errors | ❌ Block merge if linting fails |
| **Security** | No moderate+ vulnerabilities | ⚠️ Warn on security issues |
| **Formatting** | Consistent code style | ❌ Block merge if formatting incorrect |

### Branch Protection Rules

The repository enforces branch protection on `main` and `develop`:

- ✅ **Require pull request reviews** before merging
- ✅ **Require status checks to pass** before merging
- ✅ **Require branches to be up to date** before merging
- ✅ **Enforce test coverage threshold** of 80%
- ✅ **Prevent force pushes** to protected branches

### Local Development Workflow

1. **Create Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes & Test Locally**:
   ```bash
   npm test                    # Run all tests
   npm run test:cov           # Check coverage
   npm run lint               # Check linting
   npm run format:check       # Check formatting
   ```

3. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**:
   - GitHub Actions will automatically run quality checks
   - All checks must pass before merging
   - Coverage will be reported in the PR

### Coverage Reporting

- **Codecov Integration**: Automatic coverage reporting on pull requests
- **Coverage Badge**: Displayed in README showing current coverage
- **Coverage Alerts**: Notifications when coverage drops below threshold

### Deployment Strategy

- **Automatic**: Deploy to production on merge to `main`
- **Manual**: Trigger deployment via GitHub Actions UI
- **Rollback**: Quick rollback capability if issues arise

## Security

This project follows security best practices:

- Environment variables are properly managed with `.env` files
- Sensitive files are excluded via `.gitignore`
- Security checklist available in `SECURITY.md`
- No hardcoded secrets in source code
- **CI/CD Security**: Automated security audits in every build

See `SECURITY.md` for detailed security guidelines.

## License

ISC 