# Branch Protection Setup for Solo Projects

## 🎯 **Recommended Configuration**

For solo projects where you can't approve your own PRs, use this setup with code owner overrides:

### **Branch Protection Rules**

#### **For `main` branch:**
```
✅ Require a pull request before merging
✅ Require approvals: 1
✅ Dismiss stale PR approvals when new commits are pushed
✅ Require status checks to pass before merging:
   - CI/CD Pipeline
   - PR Quality Check
   - Test Coverage
✅ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Restrict pushes that create files larger than 100MB
✅ Allow specified actors to bypass required pull requests
   - Add @BritainSmith (code owner)
✅ Allow specified actors to dismiss reviews
   - Add @BritainSmith (code owner)
```

#### **For `develop` branch:**
```
✅ Require a pull request before merging
✅ Require approvals: 1
✅ Dismiss stale PR approvals when new commits are pushed
✅ Require status checks to pass before merging:
   - CI/CD Pipeline
   - PR Quality Check
   - Test Coverage
✅ Require branches to be up to date before merging
✅ Require conversation resolution before merging
✅ Restrict pushes that create files larger than 100MB
✅ Allow specified actors to bypass required pull requests
   - Add @BritainSmith (code owner)
✅ Allow specified actors to dismiss reviews
   - Add @BritainSmith (code owner)
```

## 🛡️ **Code Owner Override Setup**

As the code owner (@BritainSmith), you can:

### **Bypass Pull Request Requirements**
- ✅ **Direct push to protected branches** (emergency fixes)
- ✅ **Merge without approval** (when you're the only contributor)
- ✅ **Dismiss reviews** (if needed)

### **How to Use Overrides:**

#### **Option 1: Merge Without Approval**
1. Create your PR normally
2. When ready to merge, click "Merge pull request"
3. GitHub will show a warning about bypassing requirements
4. Click "I understand, merge anyway" (only available to code owners)

#### **Option 2: Direct Push (Emergency Only)**
```bash
# Only use for emergency fixes
git push origin develop --force-with-lease
```

#### **Option 3: Dismiss Reviews**
- If a review is blocking your PR, you can dismiss it
- Only available to code owners with dismiss permissions

## 🔄 **Workflow for Solo Development**

1. **Create feature branch**: `git checkout -b feature/new-feature`
2. **Make changes and commit**: `git commit -m "feat: add new feature"`
3. **Push branch**: `git push origin feature/new-feature`
4. **Create PR**: Use GitHub's "Compare & pull request" button
5. **Review your own code**: Add comments, check the diff
6. **Merge with override**: Use "I understand, merge anyway"
7. **Clean up**: Delete the feature branch after merge

## 🛡️ **Security Benefits**

With code owner overrides, you still get:
- ✅ **Status check enforcement** (tests, linting, coverage)
- ✅ **PR history** for all changes
- ✅ **Branch protection** against accidental direct pushes
- ✅ **Conversation tracking** for future reference
- ✅ **Code review workflow** when collaborating
- ✅ **Emergency override capability** for urgent fixes

## 🔧 **For Future Collaboration**

When you add collaborators:
1. Keep required approvals at 1 or more
2. Remove your bypass permissions (or keep for emergencies)
3. Collaborators will need your approval to merge
4. You can still override when needed

## 📝 **Best Practices**

### **When to Use Overrides:**
- ✅ **Normal development**: Create PRs and merge with override
- ✅ **Emergency fixes**: Direct push to main/develop
- ✅ **Documentation updates**: Direct push for minor docs

### **When NOT to Use Overrides:**
- ❌ **Major features**: Always use PR workflow
- ❌ **Breaking changes**: Always use PR workflow
- ❌ **Security updates**: Always use PR workflow

## 🎯 **GitHub Settings Location**

1. Go to your repository: `https://github.com/BritainSmith/job-hopper-mvp`
2. Click **Settings** → **Branches**
3. Click **Add rule** or edit existing rules
4. Configure as shown above
5. Add `@BritainSmith` to both bypass lists

---

**Note**: This setup gives you the flexibility of solo development while maintaining professional practices and preparing for future collaboration. 