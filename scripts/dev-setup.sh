#!/bin/bash

# Development Setup Script
# Ensures we're always working from the develop branch

echo "🚀 Setting up development environment..."

# Fetch latest changes
echo "📥 Fetching latest changes..."
git fetch --all

# Check if we're on develop branch
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo "🔄 Switching to develop branch..."
    git checkout develop
fi

# Pull latest changes
echo "📥 Pulling latest changes from develop..."
git pull origin develop

# Check if there are any uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes!"
    echo "   Please commit or stash them before continuing."
    git status --short
    exit 1
fi

echo "✅ Development environment ready!"
echo "📍 Current branch: $(git branch --show-current)"
echo "📝 Status: $(git status --porcelain | wc -l | tr -d ' ') files modified"

echo ""
echo "🎯 Next steps:"
echo "   1. Create a new feature branch: git checkout -b feature/your-feature-name"
echo "   2. Make your changes"
echo "   3. Commit and push: git push origin feature/your-feature-name"
echo "   4. Create a PR to develop"
echo ""
echo "💡 Remember: Always branch from develop, never from main!" 