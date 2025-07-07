#!/bin/bash

# Release Cleanup Script
# This script cleans up after a release PR has been merged

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

# Get release branch name from command line argument
if [ $# -eq 0 ]; then
    print_error "Please provide the release branch name to clean up."
    echo "Usage: $0 \"release/main-with-develop-YYYYMMDD-HHMMSS\""
    echo "Example: $0 \"release/main-with-develop-20250707-120000\""
    exit 1
fi

RELEASE_BRANCH="$1"

print_status "Cleaning up release branch: $RELEASE_BRANCH"

# Step 1: Switch to main and pull latest
print_status "Step 1: Updating main branch..."
git checkout main
git pull origin main

# Step 2: Delete the release branch locally
print_status "Step 2: Deleting local release branch..."
if git branch | grep -q "$RELEASE_BRANCH"; then
    git branch -d "$RELEASE_BRANCH"
    print_success "Local release branch deleted"
else
    print_warning "Local release branch not found (may have been deleted already)"
fi

# Step 3: Delete the release branch remotely
print_status "Step 3: Deleting remote release branch..."
if git ls-remote --heads origin "$RELEASE_BRANCH" | grep -q "$RELEASE_BRANCH"; then
    git push origin --delete "$RELEASE_BRANCH"
    print_success "Remote release branch deleted"
else
    print_warning "Remote release branch not found (may have been deleted already)"
fi

# Step 4: Update develop with latest main changes
print_status "Step 4: Updating develop branch..."
git checkout develop
git pull origin main
git push origin develop

print_success "Release cleanup completed successfully!"

# Show summary
echo ""
print_status "Cleanup Summary:"
echo "- ✅ Switched to main and pulled latest changes"
echo "- ✅ Deleted local release branch: $RELEASE_BRANCH"
echo "- ✅ Deleted remote release branch: $RELEASE_BRANCH"
echo "- ✅ Updated develop with latest main changes"
echo ""
print_status "Next steps:"
echo "1. Continue development on the develop branch"
echo "2. Create feature branches for new work"
echo "3. Use the manual release workflow for future releases"
