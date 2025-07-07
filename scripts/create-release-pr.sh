#!/bin/bash

# Manual Release PR Creation Script
# This script helps create release PRs from develop to main

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Get feature name from command line argument
if [ $# -eq 0 ]; then
    print_error "Please provide a feature name for the release."
    echo "Usage: $0 \"Feature Name\""
    echo "Example: $0 \"Currency Transformer & Enterprise Interfaces\""
    exit 1
fi

FEATURE_NAME="$1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RELEASE_BRANCH="release/main-with-develop-$TIMESTAMP"

print_status "Creating release PR for: $FEATURE_NAME"
print_status "Release branch: $RELEASE_BRANCH"

# Step 1: Ensure we're on develop and it's up to date
print_status "Step 1: Updating develop branch..."
git checkout develop
git pull origin develop

# Step 2: Create release branch
print_status "Step 2: Creating release branch..."
git checkout -b "$RELEASE_BRANCH"

# Step 3: Merge main into release branch
print_status "Step 3: Merging main into release branch..."
git fetch origin main

# Check if there are any differences between develop and main
DEVELOP_COMMIT=$(git rev-parse HEAD)
MAIN_COMMIT=$(git rev-parse origin/main)

if [ "$DEVELOP_COMMIT" = "$MAIN_COMMIT" ]; then
    print_warning "Develop and main are already in sync. No changes to release."
    git checkout develop
    git branch -d "$RELEASE_BRANCH"
    exit 0
fi

# Merge main into the release branch
if ! git merge origin/main --no-edit; then
    print_error "Merge conflicts detected. Please resolve conflicts manually:"
    echo "1. Resolve conflicts in the files listed above"
    echo "2. Keep develop version for feature files"
    echo "3. Keep main version for workflow files"
    echo "4. Run: git add . && git commit"
    echo "5. Then run this script again"
    exit 1
fi

# Step 4: Push the release branch
print_status "Step 4: Pushing release branch..."
git push origin "$RELEASE_BRANCH"

# Step 5: Create PR using GitHub CLI
print_status "Step 5: Creating PR..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_warning "GitHub CLI not found. Please create the PR manually:"
    echo "1. Go to: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/')/compare/main...$RELEASE_BRANCH"
    echo "2. Use title: 🚀 Release: $FEATURE_NAME - $(date +%Y-%m-%d)"
    echo "3. Use the PR template from docs/MANUAL_RELEASE_WORKFLOW.md"
    exit 0
fi

# Create PR with GitHub CLI
PR_TITLE="🚀 Release: $FEATURE_NAME - $(date +%Y-%m-%d)"
PR_BODY="## 🚀 **Release: $FEATURE_NAME**

### **Overview**
This release brings $FEATURE_NAME from \`develop\` into \`main\` for production deployment.

### **✨ Key Features**
- **$FEATURE_NAME**: [Add description]

### **📊 Impact**
- **Files Changed**: [Will be auto-populated]
- **Lines Added**: [Will be auto-populated]
- **Lines Removed**: [Will be auto-populated]
- **Test Coverage**: [Add test coverage info]

### **🔍 Testing**
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Linting clean
- [ ] TypeScript compilation successful

### **📚 Documentation**
- [ ] README updated
- [ ] API documentation updated
- [ ] Deployment notes added

### **🚨 Breaking Changes**
- **None** (or list any breaking changes)

### **🔧 Migration Steps**
- **None** (or list required migration steps)

### **📋 Checklist**
- [ ] Code review completed
- [ ] All CI/CD checks passing
- [ ] Documentation updated
- [ ] Ready for production deployment

---
*This PR was created automatically using the manual release workflow.*"

# Create the PR
if gh pr create \
    --title "$PR_TITLE" \
    --body "$PR_BODY" \
    --base main \
    --head "$RELEASE_BRANCH"; then
    
    print_success "Release PR created successfully!"
    print_status "PR URL: $(gh pr view --json url --jq .url)"
    
    # Show next steps
    echo ""
    print_status "Next steps:"
    echo "1. Review the PR and update the description with specific details"
    echo "2. Ensure all CI/CD checks pass"
    echo "3. Merge the PR when ready"
    echo "4. Run the cleanup script after merge: scripts/cleanup-release.sh"
    
else
    print_error "Failed to create PR. Please create it manually:"
    echo "1. Go to: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/')/compare/main...$RELEASE_BRANCH"
    echo "2. Use title: $PR_TITLE"
    echo "3. Copy the PR body above"
fi

print_success "Release branch '$RELEASE_BRANCH' is ready for review!" 