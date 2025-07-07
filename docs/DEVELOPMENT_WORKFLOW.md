# Development Workflow Guide

## 🎯 **Core Principle: Always Work from Develop**

**Main branch is for production only.** All development should happen on feature branches created from `develop`.

## 🚀 **Daily Development Setup**

### **Option 1: Use the Setup Script (Recommended)**
```bash
./scripts/dev-setup.sh
```

### **Option 2: Manual Setup**
```bash
# Fetch latest changes
git fetch --all

# Switch to develop
git checkout develop

# Pull latest changes
git pull origin develop
```

## 📋 **Feature Development Workflow**

### **1. Start Development**
```bash
# Ensure you're on develop and up to date
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name
```

### **2. Make Changes**
```bash
# Make your changes
# Test locally
npm test
npm run lint
npm run build
```

### **3. Commit and Push**
```bash
# Add changes
git add .

# Commit with conventional commit format
git commit -m "feat: add job deduplication service"

# Push to remote
git push origin feature/your-feature-name
```

### **4. Create Pull Request**
- **Base branch**: `develop` (never `main`)
- **Head branch**: `feature/your-feature-name`
- **Title**: Must follow conventional commit format (e.g., `feat: add job deduplication service`)
- **Description**: What the feature does and how to test it

**PR Title Requirements:**
- ✅ Must start with conventional commit type: `feat:`, `fix:`, `docs:`, `chore:`, etc.
- ✅ Optional scope in parentheses: `feat(scraper): add retry logic`
- ✅ Descriptive description after colon
- ✅ Lowercase letters only
- ✅ No trailing punctuation

## 🔄 **Branch Naming Conventions**

| Type | Prefix | Example |
|------|--------|---------|
| **Feature** | `feature/` | `feature/job-deduplication` |
| **Bug Fix** | `fix/` | `fix/scraper-timeout` |
| **Documentation** | `docs/` | `docs/api-documentation` |
| **Chore** | `chore/` | `chore/update-dependencies` |
| **Hotfix** | `hotfix/` | `hotfix/security-patch` |

## 🛡️ **Branch Protection Rules**

### **Main Branch**
- ✅ **Locked** - No direct pushes
- ✅ **Requires PR** - All changes via PR from develop
- ✅ **Requires CI/CD** - All checks must pass
- ✅ **Requires review** - Manual approval needed

### **Develop Branch**
- ✅ **Protected** - No force pushes
- ✅ **Requires CI/CD** - All checks must pass
- ✅ **Auto-sync** - Automatically synced with main weekly

## 🔧 **Common Commands**

### **Check Status**
```bash
git status                    # Current branch and changes
git branch -a                 # All branches
git log --oneline -5          # Recent commits
```

### **Switch Branches**
```bash
git checkout develop          # Switch to develop
git checkout -b feature/new   # Create and switch to new branch
git checkout main             # Switch to main (read-only)
```

### **Sync with Remote**
```bash
git fetch --all              # Fetch all remote changes
git pull origin develop      # Pull latest develop
git push origin feature/new  # Push feature branch
```

## 🚨 **What NOT to Do**

### **❌ Never:**
- Branch directly from `main`
- Push directly to `main`
- Push directly to `develop`
- Force push to protected branches
- Skip CI/CD checks

### **❌ Avoid:**
- Working on `main` branch
- Long-running feature branches
- Committing without testing
- Merging without PR review

## ✅ **What TO Do**

### **✅ Always:**
- Branch from `develop`
- Create descriptive branch names
- Write meaningful commit messages
- Test before committing
- Create PRs for all changes
- Keep branches small and focused

### **✅ Best Practices:**
- Use conventional commit format
- Write good PR descriptions
- Respond to review feedback
- Delete merged branches
- Keep develop up to date
- Follow PR title format requirements

## 🔄 **Sync Workflow**

The automated sync workflow keeps `develop` in sync with `main`:

- **Schedule**: Every Sunday at 2 AM UTC
- **Manual**: Can be triggered anytime
- **Process**: Creates sync PR → Auto-merges when checks pass
- **Safety**: Main stays locked throughout

## 🎯 **Quick Reference**

### **Starting a New Feature:**
```bash
./scripts/dev-setup.sh
git checkout -b feature/your-feature
# ... make changes ...
git push origin feature/your-feature
# Create PR to develop
```

### **Updating Your Branch:**
```bash
git checkout develop
git pull origin develop
git checkout feature/your-feature
git merge develop
```

### **Finishing a Feature:**
```bash
# Ensure all tests pass
npm test
npm run lint

# Push final changes
git push origin feature/your-feature

# Create PR to develop
# Wait for review and merge
# Delete local branch after merge
git branch -d feature/your-feature
```

## 🚨 **Troubleshooting**

### **PR Title Check Fails:**
If the PR title check fails, update your PR title to follow this format:
```
<type>(<scope>): <description>
```

**Examples:**
- `feat: add job deduplication service`
- `fix(scraper): resolve timeout issues`
- `docs: update API documentation`
- `chore: update dependencies`
- `hotfix: fix critical security issue`

**Allowed Types:**
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `hotfix` - Critical fixes
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Reverting changes

---

**Remember**: `develop` is your friend, `main` is for production! 🚀 