# Job Hopper – Project Overview

## Purpose
Job Hopper is a TypeScript/NestJS application that scrapes software developer job listings from multiple sources, featuring **AI-powered job filtering** and **intelligent rate limiting**. It provides robust scraping, business logic, centralized logging, API endpoints, and comprehensive automated tests.

**Current Status:** v1.1.0 "AI Intelligence" - Latest release with AI-powered job filtering, advanced rate limiting, and production-ready security.

---

## Architecture & Key Features
- **NestJS**: Modular, scalable Node.js framework
- **Prisma ORM**: Type-safe database access
- **Winston Logging**: Centralized, file+console logging
- **Swagger/OpenAPI**: Auto-generated API docs at `/api`
- **Repository/Service/Controller Layers**: Clean separation of concerns
- **DTOs & Validation**: Strong input/output validation
- **Environment Config**: Secure, validated env vars
- **Unit Tests**: Jest-based, with 558 tests across 31 suites (100% pass rate)
- **Health Check**: `/health` endpoint for monitoring
- **Versioned Scrapers**: Modular, versioned scraper architecture for maintainability
- **🤖 AI-Powered Filtering**: Intelligent job matching and recommendations
- **🔒 Advanced Rate Limiting**: Custom rate limiting with detailed error messages
- **🛡️ Security-First**: Comprehensive security audit handling and dependency management

---

## Directory Structure
```
job-hopper/
├── backend/
│   ├── src/
│   │   ├── app.module.ts           # Main app module
│   │   ├── main.ts                 # App entrypoint
│   │   ├── config/                 # Env, logger, and config modules
│   │   ├── common/                 # Shared interceptors, filters, services, guards
│   │   │   ├── guards/             # Rate limiting and security guards
│   │   │   ├── utils/              # Shared utilities (date parsing, etc.)
│   │   │   └── filters/            # Error handling filters
│   │   ├── health/                 # Health check controller/module
│   │   ├── jobs/                   # Jobs feature: controller, service, module, DTOs
│   │   │   ├── dto/                # AI filtering DTOs and validation
│   │   │   └── jobs.controller.ts  # AI endpoints and job management
│   │   ├── services/               # Business logic services
│   │   │   ├── ai.service.ts       # AI-powered job filtering
│   │   │   └── ai-job-filter.service.ts # AI job filtering logic
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
├── SECURITY_AUDIT_RESOLUTION.md     # Security audit documentation
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
- **Common**: Logging interceptor, error filter, shared services, rate limiting guards
- **AIService**: AI-powered job filtering and recommendations
- **ThrottlerModule**: Advanced rate limiting configuration

---

## API Endpoints (Summary)
- `GET /health` – Health check (status, timestamp)
- `GET /jobs` – List jobs (with filters)
- `GET /jobs/:id` – Get job by ID
- `POST /jobs` – Create a new job
- `POST /jobs/scrape` – Trigger job scraping
- `GET /jobs/stats` – Get job statistics
- `POST /jobs/ai/filter` – **AI-powered job filtering**
- `POST /jobs/ai/recommendations` – **AI-generated job recommendations**
- `GET /api` – Swagger UI (interactive API docs)

### 🤖 AI Filtering Endpoints
- **Rate Limiting**: 3 requests per minute for AI endpoints
- **Global Rate Limiting**: 2 requests per 10 seconds
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Testing
- **Unit tests**: Jest, with 558 tests across 31 suites (100% pass rate)
- **Test coverage**: All major modules covered with comprehensive edge case testing
- **AI Service Tests**: Full unit test coverage for AI filtering logic
- **Rate Limiter Tests**: 100% test coverage for all guard functionality
- **Parser tests**: Comprehensive coverage for all scrapers
- **Service layer**: All tests passing with proper typing
- **Repository layer**: Full CRUD operation coverage
- **Run tests**: `npm test` (from backend directory)
- **Coverage enforcement**: CI/CD blocks merges if coverage drops below 80%

---

## How to Run & Develop
1. **Install dependencies**: `npm install`
2. **Set up environment**: Copy `.env.example` to `.env` and fill in values
3. **Configure AI service**: Add OpenAI API key to environment variables
4. **Run database migrations**: `npm run db:migrate`
5. **Start dev server**: `npm run dev`
6. **View API docs**: [http://localhost:3000/api](http://localhost:3000/api)
7. **Test AI filtering**: Use `/jobs/ai/filter` endpoint
8. **Run tests**: `npm test`

---

## File/Folder Guide
- `backend/src/config/` – Env config, logger config, winston module
- `backend/src/common/` – Logging interceptor, error filter, logging service, rate limiting guards
- `backend/src/health/` – HealthController, HealthModule, tests
- `backend/src/jobs/` – JobsController, JobsService, DTOs, AI endpoints, tests
- `backend/src/services/` – AI services, job filtering, business logic
- `backend/src/repositories/` – JobRepository, tests
- `backend/src/scrapers/` – Multi-source scraper services with versioned architecture
- `prisma/` – `schema.prisma`, migrations
- `logs/` – Winston log output
- `README.md` – Getting started, install, run, AI features
- `PROJECT_OVERVIEW.md` – This at-a-glance reference
- `SECURITY_AUDIT_RESOLUTION.md` – Security audit documentation

---

## TODO / Roadmap

### ✅ Completed (v1.1.0)
- [x] Add more job boards/scrapers (LinkedIn, Arbeitnow, Relocate.me, RemoteOK)
- [x] Set up CI/CD (GitHub Actions)
- [x] Comprehensive test coverage (558 tests, 100% pass rate)
- [x] Enhanced error handling and monitoring
- [x] Code quality improvements (zero ESLint errors)
- [x] Type safety enhancements with proper DTOs
- [x] Parser architecture with versioned selectors
- [x] **AI-Powered Job Filtering**: Intelligent job matching and recommendations
- [x] **Advanced Rate Limiting**: Custom rate limiting with detailed error messages
- [x] **Security Enhancements**: Security audit resolution and dependency updates
- [x] **Environment Configuration**: All AI service settings externalized

### 🚀 Planned (v1.2.0+)
- [ ] Add e2e/integration tests
- [ ] Add deployment instructions
- [ ] Add more job boards (Stack Overflow, Indeed, etc.)
- [ ] Implement job deduplication across sources
- [ ] Add job search and filtering API endpoints
- [ ] Implement job alert notifications
- [ ] Add analytics and reporting features
- [ ] **AI Model Optimization**: Fine-tune AI models for better job matching
- [ ] **Real-time Job Updates**: WebSocket support for live job updates
- [ ] **Advanced Analytics**: Job market trends and insights

---

**For more details, see the README or the codebase.** 