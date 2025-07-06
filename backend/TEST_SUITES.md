# Test Suites Documentation

## Overview

This document describes the comprehensive test suites created for the Job Hopper scraper system. The test suites ensure reliability, maintainability, and proper error handling across all scraper implementations.

**Current Status (v1.0.0 "Robust Roots"):**
- **477 tests passing** (2 skipped as expected)
- **25 test suites** covering all modules
- **100% test reliability** - All critical functionality tested
- **Parser tests:** 35/35 for relocate, 30/30 for arbeitnow
- **Service layer:** 28/28 tests passing with proper typing
- **Repository layer:** Full CRUD operation coverage

## Test Architecture

### Test Structure

```
backend/src/scrapers/
├── linkedin/
│   ├── linkedin-scraper.spec.ts          # LinkedIn scraper unit tests
│   └── v1/
│       └── linkedin-v1.parser.spec.ts    # LinkedIn v1 parser unit tests
├── arbeitnow/
│   ├── arbeitnow-scraper.spec.ts         # Arbeitnow scraper unit tests
│   └── v1/
│       └── arbeitnow-v1.parser.spec.ts   # Arbeitnow v1 parser unit tests
├── relocate/
│   ├── relocate-scraper.spec.ts          # Relocate.me scraper unit tests
│   └── v1/
│       └── relocate-v1.parser.spec.ts    # Relocate.me v1 parser unit tests
├── remoteok/
│   ├── remoteok-scraper.spec.ts          # RemoteOK scraper unit tests
│   └── v1/
│       └── remoteok-v1.parser.spec.ts    # RemoteOK v1 parser unit tests
└── scraper-factory.spec.ts               # Scraper factory integration tests
```

## Test Coverage

### 1. LinkedIn Scraper Tests (`linkedin-scraper.spec.ts`)

**Coverage Areas:**
- ✅ Initialization and configuration
- ✅ Rate limiting configuration
- ✅ Job scraping with various options
- ✅ Version detection and management
- ✅ URL building and pagination
- ✅ Health checks and error handling
- ✅ Network timeout handling
- ✅ Malformed HTML handling

**Key Test Scenarios:**
- Scraping jobs with default options
- Respecting maxPages and maxJobs limits
- Handling HTTP errors (404, 429, etc.)
- Version detection for different HTML structures
- Health check functionality
- Error recovery mechanisms

### 2. LinkedIn Parser Tests (`linkedin-v1.parser.spec.ts`)

**Coverage Areas:**
- ✅ HTML parsing and job extraction
- ✅ Date parsing (relative and absolute)
- ✅ URL normalization
- ✅ Source ID generation
- ✅ Pagination detection
- ✅ Error handling for malformed HTML

**Key Test Scenarios:**
- Parsing valid LinkedIn job HTML
- Handling missing optional fields
- Skipping jobs with missing required fields
- Relative date parsing ("2 days ago", "3 hours ago")
- URL normalization (relative to absolute)
- Special character handling in source IDs
- Pagination detection and current page extraction

### 3. Arbeitnow Scraper Tests (`arbeitnow-scraper.spec.ts`)

**Coverage Areas:**
- ✅ German job board specific features
- ✅ Visa sponsorship handling
- ✅ Relocation package detection
- ✅ Rate limiting for German sites
- ✅ Error handling and recovery

**Key Test Scenarios:**
- German location handling (München, Deutschland)
- Visa sponsorship tag extraction
- Relocation package identification
- Rate limiting configuration (30 req/min)
- Network error handling

### 4. Relocate.me Scraper Tests (`relocate-scraper.spec.ts`)

**Coverage Areas:**
- ✅ International job features
- ✅ Multi-country location handling
- ✅ Remote/on-site work indicators
- ✅ International date formats
- ✅ Relocation package detection

**Key Test Scenarios:**
- Multi-country location parsing
- Visa sponsorship and relocation packages
- Remote vs on-site work indicators
- International date format handling
- 404 error handling for incorrect URLs

### 5. RemoteOK Scraper Tests (`remoteok-scraper.spec.ts`)

**Coverage Areas:**
- ✅ Remote job board specific features
- ✅ Salary information extraction
- ✅ Tag/skill parsing
- ✅ Rate limiting configuration
- ✅ Error handling and recovery

**Key Test Scenarios:**
- Remote job parsing and validation
- Salary range extraction and formatting
- Skill tag parsing and normalization
- Rate limiting configuration (30 req/min)
- Network error handling

### 6. Scraper Factory Tests (`scraper-factory.spec.ts`)

**Coverage Areas:**
- ✅ Factory initialization and registration
- ✅ Scraper retrieval and management
- ✅ Configuration management
- ✅ Health checks across all scrapers
- ✅ Rate limiting configuration validation
- ✅ Error handling and recovery

**Key Test Scenarios:**
- All scrapers properly registered
- Configuration retrieval and updates
- Health check functionality
- Rate limiting validation for each scraper
- Error handling for unknown scrapers

## Test Configuration

### Rate Limiting Validation

Each scraper has specific rate limiting configurations that are validated:

```typescript
// LinkedIn: Conservative rate limiting
{
  requestsPerMinute: 20,
  delayBetweenRequests: { min: 3000, max: 8000 },
  maxConcurrentRequests: 1
}

// Arbeitnow: Moderate rate limiting
{
  requestsPerMinute: 30,
  delayBetweenRequests: { min: 2000, max: 5000 },
  maxConcurrentRequests: 2
}

// Relocate.me: Balanced rate limiting
{
  requestsPerMinute: 25,
  delayBetweenRequests: { min: 2500, max: 6000 },
  maxConcurrentRequests: 2
}

// RemoteOK: Standard rate limiting
{
  requestsPerMinute: 30,
  delayBetweenRequests: { min: 2000, max: 5000 },
  maxConcurrentRequests: 1
}
```

### Error Handling Patterns

All tests validate consistent error handling patterns:

1. **HTTP Errors**: 404, 429, 500 status codes
2. **Network Errors**: Timeouts, connection failures
3. **Parsing Errors**: Malformed HTML, missing elements
4. **Validation Errors**: Missing required fields

## Running Tests

### Individual Test Suites

```bash
# Run all scraper tests
npm test -- --testPathPattern="scrapers"

# Run specific scraper tests
npm test -- --testPathPattern="linkedin"
npm test -- --testPathPattern="arbeitnow"
npm test -- --testPathPattern="relocate"
npm test -- --testPathPattern="remoteok"

# Run parser tests only
npm test -- --testPathPattern="parser"

# Run factory tests only
npm test -- --testPathPattern="scraper-factory"
```

### Test Options

```bash
# Verbose output
npm test -- --testPathPattern="scrapers" --verbose

# Increased timeout for network tests
npm test -- --testPathPattern="scrapers" --testTimeout=10000

# Watch mode for development
npm test -- --testPathPattern="scrapers" --watch
```

## Mocking Strategy

### HTTP Request Mocking

Tests use Jest mocking to avoid real HTTP requests:

```