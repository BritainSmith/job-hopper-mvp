# Job Hopper - AI-Powered Multi-Source Job Scraper

[![CI/CD Pipeline](https://github.com/britain/job-hopper/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/britain/job-hopper/actions/workflows/ci.yml)
[![PR Quality Check](https://github.com/britain/job-hopper/workflows/Pull%20Request%20Quality%20Check/badge.svg)](https://github.com/britain/job-hopper/actions/workflows/pr-check.yml)
[![Test Coverage](https://codecov.io/gh/britain/job-hopper/branch/main/graph/badge.svg)](https://codecov.io/gh/britain/job-hopper)

A TypeScript-based web scraper using Puppeteer to extract software developer job listings from multiple sources, with a NestJS backend featuring **AI-powered job filtering** and **intelligent rate limiting** for scalable API development.

## 🎉 v1.1.0 "AI Intelligence" - Latest Release

**Released:** July 2025  
**Tag:** `v1.1.0`

### 🤖 **AI-Powered Job Filtering**
- ✅ **Intelligent Job Matching**: AI-powered filtering based on skills, experience, and preferences
- ✅ **Smart Recommendations**: AI-generated job recommendations with relevance scoring
- ✅ **Flexible Filter Criteria**: Support for required skills, preferred skills, experience levels, and location preferences
- ✅ **Configurable AI Models**: Environment-based AI service configuration
- ✅ **Comprehensive DTOs**: Type-safe request/response handling with proper validation

### 🔒 **Advanced Rate Limiting**
- ✅ **CustomThrottlerGuard**: Enhanced error messages with detailed rate limit information
- ✅ **Rate Limit Headers**: Proper HTTP headers for client consumption (`X-RateLimit-*`)
- ✅ **Reset Time Calculation**: Accurate rate limit reset timestamps
- ✅ **Global & Endpoint-Specific Limits**: Configurable rate limiting per endpoint
- ✅ **API Protection**: Prevents abuse and ensures fair usage

### 🛡️ **Security Enhancements**
- ✅ **Security Audit Resolution**: Addressed false positive multer vulnerability
- ✅ **Dependency Updates**: Updated to latest NestJS versions (11.1.4)
- ✅ **False Positive Handling**: Proper documentation of security audit resolution
- ✅ **Audit Compliance**: Safe handling of security audits in CI/CD

### 🧪 **Comprehensive Testing**
- ✅ **558 tests passing** (1 skipped as expected) - 100% test reliability
- ✅ **AI Service Tests**: Full unit test coverage for AI filtering logic
- ✅ **Rate Limiter Tests**: 100% test coverage for all guard functionality
- ✅ **Integration Tests**: End-to-end testing of both features
- ✅ **Type Safety**: Full TypeScript compliance with proper DTOs

## 🚀 Recent Major Updates (v1.1.0)

### ✅ **AI Integration & Intelligence**
- **AI Job Filtering**: New endpoints `/jobs/ai/filter` and `/jobs/ai/recommendations` for intelligent job matching
- **Smart Recommendations**: AI-powered job suggestions based on user preferences and skills
- **Flexible Filtering**: Support for required skills, preferred skills, experience levels, and location preferences
- **Environment Configuration**: All AI service settings externalized to environment variables

### ✅ **Rate Limiting & API Protection**
- **CustomThrottlerGuard**: Enhanced rate limiting with detailed error messages and reset timestamps
- **Global Rate Limiting**: 2 requests per 10 seconds globally
- **Endpoint-Specific Limits**: 3 requests per minute for AI endpoints
- **Rate Limit Headers**: Proper HTTP headers for client-side tracking
- **API Protection**: Prevents abuse and ensures fair usage across all endpoints

### ✅ **Security & Dependencies**
- **Security Audit Resolution**: Properly documented false positive multer vulnerability
- **Dependency Updates**: Latest NestJS versions (11.1.4) with security patches
- **CI/CD Security**: Safe handling of security audits in automated pipelines
- **Production Ready**: All security issues resolved and documented

## Features

- 🚀 Scrapes software developer job listings from multiple sources:
  - **RemoteOK** - Remote job board (via RemoteOKScraper only)
  - **LinkedIn** - Professional job listings
  - **Arbeitnow** - German job board with visa sponsorship
  - **Relocate.me** - International relocation-focused jobs
- 🤖 **AI-Powered Job Filtering**: Intelligent job matching based on skills, experience, and preferences
- 🔒 **Advanced Rate Limiting**: Custom rate limiting with detailed error messages and headers
- 📅 **Flexible Date Parsing**: All scrapers use a shared utility to handle ISO, US/EU, German, and relative date formats
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
- 🔒 **Security-first approach with comprehensive audit handling**

## 🤖 AI Job Filtering API

### Endpoints

#### `POST /jobs/ai/filter`
Intelligent job filtering based on AI analysis of job requirements and user preferences.

**Request Body:**
```typescript
{
  "aiFilters": {
    "requiredSkills": ["JavaScript", "React", "Node.js"],
    "preferredSkills": ["TypeScript", "AWS"],
    "experienceLevel": "senior",
    "location": "remote",
    "maxResults": 10
  }
}
```

#### `POST /jobs/ai/recommendations`
AI-generated job recommendations with relevance scoring.

**Response:**
```typescript
{
  "jobs": [
    {
      "title": "Senior Full Stack Developer",
      "company": "TechCorp",
      "location": "Remote",
      "applyLink": "https://example.com/job/123",
      "postedDate": "2023-07-01T00:00:00.000Z",
      "salary": "$80k - $120k",
      "tags": ["React", "Node.js", "TypeScript"],
      "relevanceScore": 0.95,
      "aiAnalysis": {
        "confidence": 0.9,
        "processingTime": 150,
        "costEstimate": 0.0000741
      }
    }
  ]
}
```

### Rate Limiting
- **Global**: 2 requests per 10 seconds
- **AI Endpoints**: 3 requests per minute
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

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

### Basic Scraping
```typescript
import { RemoteOKScraper } from './src/scrapers/remoteok/remoteok-scraper';

const scraper = new RemoteOKScraper();
const jobs = await scraper.scrapeJobs({ maxPages: 3, maxJobs: 50 });
```

### AI Job Filtering
```typescript
// Using the AI filtering API
const response = await fetch('http://localhost:3000/jobs/ai/filter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    aiFilters: {
      requiredSkills: ['JavaScript', 'React'],
      preferredSkills: ['TypeScript'],
      experienceLevel: 'senior',
      maxResults: 10
    }
  })
});

const filteredJobs = await response.json();
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
- **Rate limiting is enforced** to prevent API abuse

## Troubleshooting

### Common Issues

1. **Browser fails to launch**: Make sure you have Chrome/Chromium installed
2. **No jobs found**: The website structure may have changed - check the selectors
3. **Rate limiting**: Increase the delay between requests
4. **Timeout errors**: Increase the timeout values in the code
5. **AI API errors**: Check your OpenAI API key configuration in environment variables

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
│   │   ├── services/         # Business logic services (including AI services)
│   │   ├── scrapers/         # Job scraping services (modular, versioned)
│   │   ├── common/           # Shared utilities and guards
│   │   │   ├── guards/       # Rate limiting and security guards
│   │   │   ├── utils/        # Shared utilities (e.g., date parsing)
│   │   │   └── filters/      # Error handling filters
│   │   ├── jobs/             # Job-related controllers and DTOs
│   │   ├── prisma/           # NestJS Prisma service & module
│   │   ├── app.module.ts     # Main application module
│   │   └── main.ts           # Application entry point
│   ├── prisma -> ../prisma   # Symlink to shared schema
│   └── .env -> ../.env       # Symlink to shared env
├── .env.example              # Environment template
├── SECURITY_AUDIT_RESOLUTION.md # Security audit documentation
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
- **Rate Limiting**: API protection against abuse
- **Security Audit Resolution**: Proper handling of false positives
- **Dependency Updates**: Latest versions with security patches

### Security Audit Status
- **Multer Vulnerability (GHSA-fjgf-rc76-4x9p)**: ✅ **RESOLVED** (False positive - using patched version 2.0.1)
- **NestJS Dependencies**: ✅ **UPDATED** (Latest versions 11.1.4)
- **Audit Level**: ✅ **CONFIGURED** (Safe handling in CI/CD)
- **Documentation**: ✅ **COMPLETE** (Security audit resolution documented)

See `SECURITY.md` for detailed security guidelines and `SECURITY_AUDIT_RESOLUTION.md` for audit resolution details.

## License

ISC 