# Branch Protection Setup for Solo Projects

## 🎯 **Recommended Configuration**

For solo projects where you can't approve your own PRs, use this setup:

### **Branch Protection Rules**

#### **For `main` branch:**
```
✅ Require a pull request before merging
✅ Require approvals: 0 (for solo development)
✅ Require status checks to pass before merging:
   - CI/CD Pipeline
   - PR Quality Check
   - Test Coverage
✅ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Restrict pushes that create files larger than 100MB
✅ Do not allow bypassing the above settings
```

#### **For `develop` branch:**
```
✅ Require a pull request before merging
✅ Require approvals: 0 (for solo development)
✅ Require status checks to pass before merging:
   - CI/CD Pipeline
   - PR Quality Check
   - Test Coverage
✅ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Restrict pushes that create files larger than 100MB
✅ Allow specified actors to bypass required pull requests
   - Add @BritainSmith for emergency fixes
```

## 🤖 **Auto-Merge Setup**

The repository includes an auto-merge GitHub Action that will automatically merge PRs when:
- All status checks pass
- The PR is created by @BritainSmith
- No merge conflicts exist

### **How it works:**
1. Create a PR from a feature branch
2. All CI/CD checks run automatically
3. If all checks pass, the PR is auto-merged
4. If checks fail, you can fix and push - it will re-run

## 🔄 **Workflow for Solo Development**

1. **Create feature branch**: `git checkout -b feature/new-feature`
2. **Make changes and commit**: `git commit -m "feat: add new feature"`
3. **Push branch**: `git push origin feature/new-feature`
4. **Create PR**: Use GitHub's "Compare & pull request" button
5. **Auto-merge**: If all checks pass, PR merges automatically
6. **Clean up**: Delete the feature branch after merge

## 🛡️ **Security Benefits**

Even with 0 required approvals, you still get:
- ✅ **Status check enforcement** (tests, linting, coverage)
- ✅ **PR history** for all changes
- ✅ **Branch protection** against direct pushes
- ✅ **Conversation tracking** for future reference
- ✅ **Code review workflow** when collaborating

## 🔧 **For Future Collaboration**

When you add collaborators:
1. Increase required approvals to 1 or more
2. Remove auto-merge for non-solo PRs
3. Keep all other protections in place

## 📝 **Alternative: Manual Merge**

If you prefer manual control:
1. Disable auto-merge
2. Set required approvals to 0
3. Manually merge PRs after reviewing them
4. Use "Squash and merge" for clean history

---

**Note**: This setup maintains professional development practices while being practical for solo development. 