# Job Hopper - Multi-Source Job Scraper

[![CI/CD Pipeline](https://github.com/britain/job-hopper/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/britain/job-hopper/actions/workflows/ci.yml)
[![PR Quality Check](https://github.com/britain/job-hopper/workflows/Pull%20Request%20Quality%20Check/badge.svg)](https://github.com/britain/job-hopper/actions/workflows/pr-check.yml)
[![Test Coverage](https://codecov.io/gh/britain/job-hopper/branch/main/graph/badge.svg)](https://codecov.io/gh/britain/job-hopper)

A TypeScript-based web scraper using Puppeteer to extract software developer job listings from multiple sources, with a NestJS backend for scalable API development.

## 🎉 v1.0.0 "Robust Roots" - First Stable Release

**Released:** July 2025  
**Tag:** `v1.0.0`

### 🏗️ **Foundation Established**
- ✅ **477 tests passing** (2 skipped as expected) - 100% test reliability
- ✅ **Zero ESLint errors** - Clean, maintainable codebase
- ✅ **Parser architecture solidified** - All parsers working with comprehensive test coverage
- ✅ **Type safety enhanced** - Proper DTOs and interfaces throughout
- ✅ **Error handling robust** - Comprehensive error handling and logging

### 🧪 **Test Suite Excellence**
- **25 test suites** covering all modules
- **Parser tests:** 35/35 for relocate, 30/30 for arbeitnow
- **Service layer:** 28/28 tests passing with proper typing
- **Repository layer:** Full CRUD operation coverage
- **Error handling:** Comprehensive edge case testing

### 🔧 **Code Quality Improvements**
- **160+ ESLint errors resolved** across the codebase
- **Enhanced type safety** in JobService with proper DTOs
- **Improved error handling** in logging services and interceptors
- **Fixed async/await issues** and decorator errors
- **Consolidated ESLint rules** for cleaner, more maintainable code

## 🚀 Recent Major Updates (v1.0.0)

### ✅ **Architecture & Scraper Improvements**
- **Unified Date Parsing**: All scrapers now use a shared `parseFlexibleDate` utility, supporting ISO, US/EU, German, and relative date formats for robust, consistent date handling.
- **Legacy Code Cleanup**: Removed all unused/legacy scrapers, including the old RemoteOKService. Only the modular `RemoteOKScraper` is used for RemoteOK jobs.
- **Modular Scraper System**: Each scraper is versioned and isolated, making it easy to add or update scrapers as sites change.
- **How to Add a Scraper**: See `NEW_SCRAPERS.md` for a step-by-step guide to adding new scrapers using the modular, versioned approach.

### ✅ **Testing Enhancements**
- **Comprehensive Test Coverage**: 477 tests across 25 suites, with 100% pass rate for all active scrapers and utilities.
- **Test Enforcement**: All new code must include unit tests. CI/CD blocks merges if coverage drops below 80%.
- **Legacy Test Cleanup**: Removed tests for deleted/unused code. All tests now reflect the current implementation.
- **Scraper Test Expansion**: RemoteOKScraper, LinkedIn, Arbeitnow, and Relocate scrapers all have robust, scenario-driven unit tests.

### 🎯 **Production Readiness**
- **100% Test Coverage for Core Modules**: Controllers, services, repositories, filters, interceptors, and config are fully covered.
- **Maintainable Codebase**: Regularly delete unused code and keep documentation up to date.
- **Error Resilience**: Comprehensive error handling and logging throughout.

## Features

- 🚀 Scrapes software developer job listings from multiple sources:
  - **RemoteOK** - Remote job board (via RemoteOKScraper only)
  - **LinkedIn** - Professional job listings
  - **Arbeitnow** - German job board with visa sponsorship
  - **Relocate.me** - International relocation-focused jobs
- 📅 **Flexible Date Parsing**: All scrapers use a shared utility to handle ISO, US/EU, German, and relative date formats.
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
- 🧪 **Comprehensive test coverage with >96% for all active scrapers**
- 🔄 **Proper dependency injection and modular architecture**
- 🎯 **Production-ready architecture with robust error handling**

## 🧩 Shared Date Parsing Utility

All scrapers use the `parseFlexibleDate` utility (`src/common/utils/date.util.ts`) to robustly handle:
- ISO dates (YYYY-MM-DD)
- US/EU slash dates (MM/DD/YYYY, DD/MM/YYYY)
- German dates (DD.MM.YYYY, DD.MM.YY)
- Relative dates (e.g., "2d ago", "3 hours ago")
- Falls back to the current date on error

This ensures consistent, reliable date handling across all job sources.

## 🧪 Testing & Coverage

- **All new code must include unit tests.**
- **Test coverage is strictly enforced** (80% minimum, >96% for scrapers/utilities).
- **Legacy/unused code is regularly deleted** to keep the codebase clean and maintainable.
- **See `TEST_SUITES.md` for a breakdown of test coverage and requirements.**

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

## Programmatic Usage

```typescript
import { RemoteOKScraper } from './src/scrapers/remoteok/remoteok-scraper';

const scraper = new RemoteOKScraper();
const jobs = await scraper.scrapeJobs({ maxPages: 3, maxJobs: 50 });
```

## Adding a New Scraper

- See `NEW_SCRAPERS.md` for a step-by-step guide.
- Use the modular, versioned approach: create a new directory under `src/scrapers/` and implement a parser and scraper class.
- Use the shared `parseFlexibleDate` utility for all date fields.
- Add comprehensive unit tests for all new code.

## Output Format

The scraper extracts the following data for each job:

```typescript
interface JobListing {
  title: string;        // Job title
  company: string;      // Company name
  location: string;     // Job location (usually "Remote")
  applyLink: string;    // Direct link to apply
  postedDate?: string;  // When the job was posted (parsed with parseFlexibleDate)
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
    "postedDate": "2023-07-01T00:00:00.000Z",
    "salary": "$80k - $120k",
    "tags": ["React", "Node.js", "TypeScript"]
  }
]
```

## Ethical Considerations

- The scraper includes built-in delays to be respectful to job board servers
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
const scraper = new RemoteOKScraper();
const jobs = await scraper.scrapeJobs({ headless: false, maxPages: 1 });
```

## Project Structure

```
job-hopper/
├── prisma/                    # Database schema & migrations (single source of truth)
├── backend/                   # NestJS application
│   ├── src/
│   │   ├── config/           # Configuration modules
│   │   ├── repositories/     # Data access layer
│   │   ├── services/         # Business logic services
│   │   ├── scrapers/         # Job scraping services (modular, versioned)
│   │   ├── common/utils/     # Shared utilities (e.g., date parsing)
│   │   ├── prisma/           # NestJS Prisma service & module
│   │   ├── app.module.ts     # Main application module
│   │   └── main.ts           # Application entry point
│   ├── prisma -> ../prisma   # Symlink to shared schema
│   └── .env -> ../.env       # Symlink to shared env
├── .env.example              # Environment template
└── README.md                 # Project documentation
```

## CI/CD, Security, and More

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