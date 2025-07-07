# Automated Sync Workflow

## 🔄 **Overview**

The automated sync workflow keeps the `develop` branch up to date with the latest changes from `main` **without requiring the main branch to be unlocked**.

## 🕐 **Schedule**

- **Automatic**: Runs every Sunday at 2 AM UTC
- **Manual**: Can be triggered from the Actions tab

## 🛠️ **How It Works**

### **1. Check if Sync is Needed**
- Compares the latest commits of `develop` and `main`
- Only proceeds if `develop` is behind `main`

### **2. Create Sync Branch**
- Creates a new branch: `sync/develop-with-main-YYYYMMDD-HHMMSS`
- Merges latest `main` changes into the sync branch

### **3. Create Pull Request**
- Creates a PR from sync branch to `develop`
- Includes detailed sync information
- Assigns to the repository owner

### **4. Auto-Merge**
- Enables auto-merge when all checks pass
- Uses squash merge for clean history
- Maintains all branch protection rules

## 🛡️ **Safety Features**

- ✅ **Main branch stays locked** throughout the entire process
- ✅ **All CI/CD checks must pass** before merge
- ✅ **No merge conflicts** - workflow fails if conflicts exist
- ✅ **Clean git history** with squash merges
- ✅ **Detailed logging** for troubleshooting

## 🎯 **Benefits**

### **For Solo Development:**
- **Never unlock main** for regular syncs
- **Automatic weekly syncs** keep develop current
- **No manual intervention** required
- **Emergency sync capability** when needed

### **For Future Collaboration:**
- **Maintains protection rules** even with automation
- **Clear audit trail** of all syncs
- **Easy to disable** if needed
- **Customizable schedule** for team needs

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

### **Check Sync PRs:**
- **Pull requests** with `automated,sync` labels
- **Auto-merge status** in PR details
- **Merge history** in PR timeline

## 🚨 **Troubleshooting**

### **Workflow Fails:**
1. **Check logs** in Actions tab
2. **Verify branch protection** settings
3. **Check for merge conflicts**
4. **Ensure CI/CD checks pass**

### **Sync PR Not Created:**
1. **Verify develop is behind main**
2. **Check GitHub token permissions**
3. **Review workflow logs**

### **Auto-Merge Not Working:**
1. **Check branch protection rules**
2. **Verify all status checks pass**
3. **Ensure no merge conflicts**

## 🔄 **Customization**

### **Change Schedule:**
Edit the cron expression in `.github/workflows/sync-develop.yml`:
```yaml
schedule:
  - cron: '0 2 * * 0'  # Every Sunday at 2 AM UTC
```

### **Change Merge Strategy:**
Modify the merge command in the workflow:
```bash
gh pr merge $PR_NUMBER --auto --squash  # Squash merge
gh pr merge $PR_NUMBER --auto --merge   # Regular merge
gh pr merge $PR_NUMBER --auto --rebase  # Rebase merge
```

### **Add Notifications:**
Add notification steps to the workflow:
```yaml
- name: Notify on sync
  if: steps.check-sync.outputs.needs_sync == 'true'
  run: |
    # Add Slack, email, or other notifications
```

## 📝 **Best Practices**

### **Do:**
- ✅ **Monitor workflow runs** regularly
- ✅ **Review sync PRs** for unexpected changes
- ✅ **Keep main branch locked** at all times
- ✅ **Use manual trigger** for urgent syncs

### **Don't:**
- ❌ **Disable branch protection** for syncs
- ❌ **Skip CI/CD checks** on sync PRs
- ❌ **Unlock main branch** for regular syncs
- ❌ **Ignore failed syncs** without investigation

---

**Note**: This workflow ensures your develop branch stays current with main while maintaining maximum protection for your production code. 