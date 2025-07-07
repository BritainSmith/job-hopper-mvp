# Automated Sync Workflow

## 🔄 **Overview**

The automated sync workflow keeps the `develop` branch up to date with the latest changes from `main` **without requiring the main branch to be unlocked**. This workflow uses GitHub's API directly to avoid permission limitations and ensure reliable operation.

## 🕐 **Schedule**

- **Automatic**: Runs every Sunday at 2 AM UTC
- **Manual**: Can be triggered from the Actions tab

## 🛠️ **How It Works**

### **1. Check if Sync is Needed**
- Compares the latest commits of `develop` and `main`
- Only proceeds if `develop` is behind `main`
- Provides detailed logging of commit hashes for debugging

### **2. Create Sync Branch**
- Creates a new branch: `sync/develop-with-main-YYYYMMDD-HHMMSS`
- Merges latest `main` changes into the sync branch
- Pushes the branch to the repository

### **3. Create Pull Request**
- Uses GitHub API directly (not CLI) to avoid permission issues
- Creates a PR from sync branch to `develop`
- Includes detailed sync information
- Captures PR number for auto-merge

### **4. Auto-Merge**
- Uses GitHub API to merge the PR immediately
- Uses squash merge for clean history
- Maintains all branch protection rules
- Provides detailed response logging

## 🛡️ **Safety Features**

- ✅ **Main branch stays locked** throughout the entire process
- ✅ **All CI/CD checks must pass** before merge
- ✅ **No merge conflicts** - workflow fails if conflicts exist
- ✅ **Clean git history** with squash merges
- ✅ **Detailed logging** for troubleshooting
- ✅ **API-based operations** for reliable permissions
- ✅ **Error handling** with proper response validation

## 🔧 **Technical Implementation**

### **Permissions Required:**
```yaml
permissions:
  contents: write      # Push branches and commits
  pull-requests: write # Create and manage PRs
  issues: write        # Create issues (for PRs)
```

### **Authentication:**
- Uses `GITHUB_TOKEN` for API operations
- Supports fallback to `PAT_TOKEN` if configured
- Properly authenticates GitHub CLI for debugging

### **API-Based Operations:**
- **PR Creation**: Direct GitHub API calls via `curl`
- **PR Merging**: Direct GitHub API calls via `curl`
- **Error Handling**: Captures and logs API responses
- **Response Validation**: Checks for successful operations

## 🎯 **Benefits**

### **For Solo Development:**
- **Never unlock main** for regular syncs
- **Automatic weekly syncs** keep develop current
- **No manual intervention** required
- **Emergency sync capability** when needed
- **Reliable API-based operations** avoid permission issues

### **For Future Collaboration:**
- **Maintains protection rules** even with automation
- **Clear audit trail** of all syncs
- **Easy to disable** if needed
- **Customizable schedule** for team needs
- **Robust error handling** for troubleshooting

## 🔧 **Manual Trigger**

To trigger a sync manually:

1. **Go to Actions tab** in your repository
2. **Find "Auto-Sync Develop with Main"** workflow
3. **Click "Run workflow"**
4. **Select branch** (usually `develop`)
5. **Click "Run workflow"**

## 📊 **Monitoring**

### **Check Workflow Status:**
- **Actions tab** → **Auto-Sync Develop with Main**
- **Recent runs** show success/failure status
- **Detailed logs** for troubleshooting
- **API response logs** for debugging

### **Check Sync PRs:**
- **Pull requests** with sync branch names
- **Merge status** in PR details
- **Merge history** in PR timeline

## 🚨 **Troubleshooting**

### **Workflow Fails:**
1. **Check logs** in Actions tab
2. **Verify branch protection** settings
3. **Check for merge conflicts**
4. **Ensure CI/CD checks pass**
5. **Review API response logs**

### **Sync PR Not Created:**
1. **Verify develop is behind main**
2. **Check GitHub token permissions**
3. **Review workflow logs**
4. **Check API response for errors**

### **Auto-Merge Not Working:**
1. **Check branch protection rules**
2. **Verify all status checks pass**
3. **Ensure no merge conflicts**
4. **Review merge API response**

### **Permission Issues:**
1. **Verify workflow permissions** are set correctly
2. **Check branch protection** doesn't block automation
3. **Ensure GitHub token** has required scopes
4. **Review API error messages** in logs

## 🔄 **Customization**

### **Change Schedule:**
Edit the cron expression in `.github/workflows/sync-develop.yml`:
```yaml
schedule:
  - cron: '0 2 * * 0'  # Every Sunday at 2 AM UTC
```

### **Change Merge Strategy:**
Modify the merge API call in the workflow:
```json
{
  "merge_method": "squash",  // squash, merge, or rebase
  "commit_title": "🔄 Auto-sync develop with main",
  "commit_message": "Automatic sync of develop branch with latest main changes"
}
```

### **Add Notifications:**
Add notification steps to the workflow:
```yaml
- name: Notify on success
  run: |
    # Add Slack, email, or other notifications
```

### **Add Labels (Optional):**
If you want to add labels to sync PRs:
1. **Create labels** in GitHub repository settings
2. **Add to API call** in the workflow
3. **Ensure labels exist** before running

## 📝 **Best Practices**

### **Do:**
- ✅ **Monitor sync PRs** for unexpected changes
- ✅ **Review sync PRs** for unexpected changes
- ✅ **Keep main branch locked** at all times
- ✅ **Use manual trigger** for urgent syncs
- ✅ **Check API response logs** for debugging
- ✅ **Verify permissions** if workflow fails

### **Don't:**
- ❌ **Disable branch protection** for syncs
- ❌ **Skip CI/CD checks** on sync PRs
- ❌ **Unlock main branch** for regular syncs
- ❌ **Ignore failed syncs** without investigation
- ❌ **Remove workflow permissions** without testing
- ❌ **Use CLI commands** that may have permission issues

## 🔍 **Recent Improvements**

### **v2.0 - API-Based Approach:**
- ✅ **Replaced GitHub CLI** with direct API calls
- ✅ **Fixed permission issues** with proper scopes
- ✅ **Added error handling** and response validation
- ✅ **Improved logging** for better debugging
- ✅ **Enhanced reliability** with API-based operations

### **v1.0 - Initial Implementation:**
- ✅ **Basic sync functionality** with CLI approach
- ✅ **Branch protection** integration
- ✅ **Scheduled automation** setup

---

**Note**: This workflow ensures your develop branch stays current with main while maintaining maximum protection for your production code. The API-based approach provides reliable operation even with strict branch protection rules.
