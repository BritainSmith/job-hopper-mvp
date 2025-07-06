# Job Hopper – Project Overview

## Purpose
Job Hopper is a TypeScript/NestJS application that scrapes software developer job listings from RemoteOK and other sites, storing them in a database for analysis and automation. It features robust scraping, business logic, centralized logging, API endpoints, and automated tests.

**Current Status:** v1.0.0 "Robust Roots" - First stable release with comprehensive test coverage and production-ready architecture.

---

## Architecture & Key Features
- **NestJS**: Modular, scalable Node.js framework
- **Prisma ORM**: Type-safe database access
- **Winston Logging**: Centralized, file+console logging
- **Swagger/OpenAPI**: Auto-generated API docs at `/api`
- **Repository/Service/Controller Layers**: Clean separation of concerns
- **DTOs & Validation**: Strong input/output validation
- **Environment Config**: Secure, validated env vars
- **Unit Tests**: Jest-based, with 477 tests across 25 suites (100% pass rate)
- **Health Check**: `/health` endpoint for monitoring
- **Versioned Scrapers**: Modular, versioned scraper architecture for maintainability

---

## Directory Structure
```
job-hopper/
├── backend/
│   ├── src/
│   │   ├── app.module.ts           # Main app module
│   │   ├── main.ts                 # App entrypoint
│   │   ├── config/                 # Env, logger, and config modules
│   │   ├── common/                 # Shared interceptors, filters, services
│   │   ├── health/                 # Health check controller/module
│   │   ├── jobs/                   # Jobs feature: controller, service, module, DTOs
│   │   ├── repositories/           # Data access layer (repositories)
│   │   ├── scrapers/               # Scraper services for job sites
│   │   └── prisma/                 # Prisma service/module
│   ├── logs/                       # Winston log output
│   ├── node_modules/
│   ├── package.json
│   └── tsconfig.json
├── prisma/                          # Prisma schema and migrations
├── assets/                          # Static assets (e.g., resume.pdf)
├── .env, .env.example
├── .gitignore
├── README.md
├── PROJECT_OVERVIEW.md              # <--- This document
├── package.json                     # Root scripts (for monorepo style)
```

---

## Main Modules & Responsibilities
- **AppModule**: Root module, imports all features
- **ConfigModule**: Loads and validates environment variables
- **WinstonConfigModule**: Sets up centralized logging
- **PrismaModule**: Database connection and access
- **JobsModule**: Job scraping, storage, and business logic
- **HealthModule**: `/health` endpoint for monitoring
- **Common**: Logging interceptor, error filter, shared services

---

## API Endpoints (Summary)
- `GET /health` – Health check (status, timestamp)
- `GET /jobs` – List jobs (with filters)
- `GET /jobs/:id` – Get job by ID
- `POST /jobs` – Create a new job
- `POST /jobs/scrape` – Trigger job scraping
- `GET /jobs/stats` – Get job statistics
- `GET /api` – Swagger UI (interactive API docs)

---

## Testing
- **Unit tests**: Jest, with 477 tests across 25 suites (100% pass rate)
- **Test coverage**: All major modules covered with comprehensive edge case testing
- **Parser tests**: 35/35 for relocate, 30/30 for arbeitnow
- **Service layer**: 28/28 tests passing with proper typing
- **Repository layer**: Full CRUD operation coverage
- **Run tests**: `npm test` (from backend directory)
- **Coverage enforcement**: CI/CD blocks merges if coverage drops below 80%

---

## How to Run & Develop
1. **Install dependencies**: `npm install`
2. **Set up environment**: Copy `.env.example` to `.env` and fill in values
3. **Run database migrations**: `npm run db:migrate`
4. **Start dev server**: `npm run dev`
5. **View API docs**: [http://localhost:3000/api](http://localhost:3000/api)
6. **Run tests**: `npm test`

---

## File/Folder Guide
- `backend/src/config/` – Env config, logger config, winston module
- `backend/src/common/` – Logging interceptor, error filter, logging service
- `backend/src/health/` – HealthController, HealthModule, tests
- `backend/src/jobs/` – JobsController, JobsService, DTOs, tests
- `backend/src/repositories/` – JobRepository, tests
- `backend/src/scrapers/` – RemoteOKService, dynamic scraper logic
- `prisma/` – `schema.prisma`, migrations
- `logs/` – Winston log output
- `README.md` – Getting started, install, run
- `PROJECT_OVERVIEW.md` – This at-a-glance reference

---

## TODO / Roadmap

### ✅ Completed (v1.0.0)
- [x] Add more job boards/scrapers (LinkedIn, Arbeitnow, Relocate.me, RemoteOK)
- [x] Set up CI/CD (GitHub Actions)
- [x] Comprehensive test coverage (477 tests, 100% pass rate)
- [x] Enhanced error handling and monitoring
- [x] Code quality improvements (zero ESLint errors)
- [x] Type safety enhancements with proper DTOs
- [x] Parser architecture with versioned selectors

### 🚀 Planned (v1.1.0+)
- [ ] Add e2e/integration tests
- [ ] Add deployment instructions
- [ ] Add more job boards (Stack Overflow, Indeed, etc.)
- [ ] Implement job deduplication across sources
- [ ] Add job search and filtering API endpoints
- [ ] Implement job alert notifications
- [ ] Add analytics and reporting features

---

**For more details, see the README or the codebase.** 