# GitHub Actions CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions to enforce code quality, maintain test coverage, and ensure reliable deployments. The CI/CD pipeline is designed to prevent the issues we encountered with test maintenance and ensure consistent code quality.

## Workflow Files

### 1. Pull Request Quality Check (`pr-check.yml`)

**Purpose**: Enforce quality standards on every pull request before merging.

**Triggers**:
- Pull requests to `main` or `develop` branches

**Enforced Standards**:
- ✅ All tests must pass (100% success rate)
- 📊 Test coverage must be above 80%
- 🏗️ Application must build successfully
- 🔍 Code must pass ESLint checks
- 🎨 Code formatting must be correct (Prettier)
- 🔒 Security audit must pass (no moderate+ vulnerabilities)

**Benefits**:
- Prevents broken code from being merged
- Maintains consistent code quality
- Ensures test coverage doesn't degrade
- Catches security issues early

### 2. Full CI/CD Pipeline (`ci.yml`)

**Purpose**: Comprehensive testing and validation for all code changes.

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs**:
1. **Test & Coverage**: Runs all tests with coverage reporting
2. **Build**: Ensures application builds successfully
3. **Lint & Format**: Checks code quality and formatting
4. **Security Audit**: Scans for vulnerabilities
5. **Database Migration**: Validates database schema
6. **Integration Tests**: Runs end-to-end tests
7. **Quality Gates**: Final validation before deployment

**Benefits**:
- Comprehensive validation of all changes
- Parallel job execution for faster feedback
- Coverage reporting to Codecov
- Database schema validation

### 3. Production Deployment (`deploy.yml`)

**Purpose**: Deploy to production after all quality checks pass.

**Triggers**:
- Push to `main` branch
- Manual dispatch (for emergency deployments)

**Features**:
- Final test validation
- Production build creation
- Artifact upload for deployment
- Deployment to production environment

## Quality Gates

The pipeline enforces strict quality standards through multiple gates:

| Gate | Requirement | Action | Impact |
|------|-------------|---------|---------|
| **Test Coverage** | ≥80% overall | ❌ Block merge | Prevents coverage degradation |
| **All Tests Pass** | 100% test success | ❌ Block merge | Ensures no broken functionality |
| **Build Success** | Clean build | ❌ Block merge | Prevents deployment issues |
| **Linting** | No linting errors | ❌ Block merge | Maintains code consistency |
| **Security** | No moderate+ vulnerabilities | ⚠️ Warn | Security awareness |
| **Formatting** | Consistent code style | ❌ Block merge | Maintains readability |

## Branch Protection Rules

The repository enforces branch protection on `main` and `develop`:

### Required Status Checks
- ✅ **Pull Request Quality Check** must pass
- ✅ **Full CI/CD Pipeline** must pass
- ✅ **Test Coverage** must be above 80%

### Pull Request Requirements
- ✅ **Require pull request reviews** before merging
- ✅ **Require status checks to pass** before merging
- ✅ **Require branches to be up to date** before merging
- ✅ **Prevent force pushes** to protected branches

## Local Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes & Test Locally
```bash
npm test                    # Run all tests
npm run test:cov           # Check coverage
npm run lint               # Check linting
npm run format:check       # Check formatting
```

### 3. Commit & Push
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### 4. Create Pull Request
- GitHub Actions will automatically run quality checks
- All checks must pass before merging
- Coverage will be reported in the PR

## Coverage Reporting

### Codecov Integration
- **Automatic Upload**: Coverage reports uploaded to Codecov on every build
- **PR Comments**: Coverage changes reported in pull request comments
- **Coverage Badge**: Displayed in README showing current coverage
- **Coverage Alerts**: Notifications when coverage drops below threshold

### Coverage Thresholds
- **Overall Coverage**: ≥80%
- **Branches**: ≥80%
- **Functions**: ≥80%
- **Lines**: ≥80%
- **Statements**: ≥80%

## Security Features

### Automated Security Audits
- **NPM Audit**: Scans for known vulnerabilities
- **Audit Level**: Moderate and above
- **Frequency**: Every build and pull request
- **Action**: Warnings for security issues

### Security Best Practices
- **No Hardcoded Secrets**: All secrets managed via environment variables
- **Dependency Scanning**: Regular vulnerability scanning
- **Secure Dependencies**: Only trusted packages used

## Deployment Strategy

### Automatic Deployment
- **Trigger**: Merge to `main` branch
- **Prerequisites**: All quality checks must pass
- **Process**: Automated deployment to production
- **Rollback**: Quick rollback capability if issues arise

### Manual Deployment
- **Trigger**: Manual dispatch via GitHub Actions UI
- **Use Case**: Emergency deployments or hotfixes
- **Process**: Same quality checks as automatic deployment

## Troubleshooting

### Common Issues

#### 1. Coverage Below Threshold
**Problem**: Test coverage drops below 80%
**Solution**: 
- Add tests for uncovered code
- Remove unused code
- Refactor to improve testability

#### 2. Linting Failures
**Problem**: ESLint finds code style issues
**Solution**:
```bash
npm run lint              # Check what's wrong
npm run format            # Auto-fix formatting issues
```

#### 3. Build Failures
**Problem**: Application fails to build
**Solution**:
- Check TypeScript compilation errors
- Verify all dependencies are installed
- Check for missing imports

#### 4. Security Audit Failures
**Problem**: NPM audit finds vulnerabilities
**Solution**:
- Update vulnerable dependencies
- Review security advisories
- Consider alternative packages if needed

### Debugging Workflows

#### View Workflow Logs
1. Go to GitHub repository
2. Click "Actions" tab
3. Select the workflow run
4. Click on the failing job
5. Review the logs for error details

#### Local Testing
```bash
# Test the same commands locally
npm ci                    # Clean install
npm run db:generate      # Generate Prisma client
npm test                 # Run tests
npm run test:cov         # Check coverage
npm run build            # Build application
npm run lint             # Check linting
npm run format:check     # Check formatting
npm audit                # Security audit
```

## Maintenance

### Regular Tasks
- **Weekly**: Review security audit results
- **Monthly**: Update dependencies
- **Quarterly**: Review and update quality thresholds
- **As Needed**: Update workflow configurations

### Monitoring
- **Coverage Trends**: Monitor coverage over time
- **Build Times**: Track workflow execution times
- **Failure Rates**: Monitor common failure patterns
- **Security Alerts**: Respond to security notifications

## Future Enhancements

### Planned Improvements
- **Performance Testing**: Add performance benchmarks
- **Load Testing**: Test application under load
- **Dependency Updates**: Automated dependency updates
- **Release Automation**: Automated version bumping and releases
- **Slack Notifications**: Notify team of deployment status

### Advanced Features
- **Multi-Environment**: Support for staging and production
- **Database Migrations**: Automated migration testing
- **API Contract Testing**: Validate API contracts
- **Load Testing**: Performance validation
- **Security Scanning**: Advanced security analysis

## Resources

### Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.io/)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)

### Tools
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Codecov](https://codecov.io/)
- [NPM Audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)

### Best Practices
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/) 