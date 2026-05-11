# 🚀 Deployment Guide - GitHub & Azure

## Current Status

✅ **Local Setup Complete**
- Git repository initialized
- All source code committed
- Branches created: `main` (production), `staging` (pre-production)
- CI/CD pipeline configured
- Azure infrastructure templates ready
- Docker images optimized for production

## Quick Summary (3 Steps)

```powershell
# Step 1: Run automated deployment script
.\deploy-all.ps1

# Step 2: Add GitHub Secrets (see output from step 1)

# Step 3: Push code to GitHub and watch it deploy!
git push origin main
```

---

## Detailed Steps

### **Step 1: Create GitHub Repository**

**Option A: Manual (Web UI)**
1. Go to https://github.com/new
2. Create repository:
   - Name: `event-management-system`
   - Visibility: `Public`
   - Do NOT initialize with README (we have files)
3. Click "Create repository"
4. Copy the HTTPS URL (or SSH if you have keys set up)

**Option B: Automated with GitHub CLI**
```powershell
# If you have GitHub CLI installed
gh repo create event-management-system --public
```

---

### **Step 2: Add GitHub Remote & Push Code**

```powershell
cd c:\Users\MuhammadAqib\Desktop\event-management-system

# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/event-management-system.git

# Verify remote was added
git remote -v

# Push main branch to GitHub
git push -u origin main

# Push staging branch to GitHub
git push -u origin staging

# Verify branches in GitHub
git branch -v
```

**Expected Output:**
```
main    5af7f57 docs: add comprehensive GitHub and Azure deployment setup guide
staging 5af7f57 docs: add comprehensive GitHub and Azure deployment setup guide
```

---

### **Step 3: Deploy Azure Infrastructure**

Run the automated deployment script:

```powershell
# From project root directory
.\deploy-all.ps1
```

**The script will:**
1. ✅ Verify Azure CLI is installed
2. ✅ Check Azure authentication
3. ✅ Create resource group: `rg-event-management-prod`
4. ✅ Deploy infrastructure using Bicep templates
5. ✅ Create Service Principal for GitHub
6. ✅ Output all necessary credentials

**When prompted:**
- PostgreSQL password: Use strong 12+ character password (e.g., `P@ssw0rd2026!`)

**What gets deployed:**
```
✓ Container Registry (store Docker images)
✓ Container Apps Environment (host apps)
✓ PostgreSQL Database (event data)
✓ Redis Cache (sessions/caching)
✓ Application Insights (monitoring)
✓ Log Analytics Workspace (logs)
✓ Service Principal (GitHub authentication)
```

**Estimated time**: 5-10 minutes

---

### **Step 4: Save GitHub Secrets**

After Azure deployment, the script outputs:

```
AZURE_SUBSCRIPTION_ID=xxxx-xxxx-xxxx
AZURE_TENANT_ID=yyyy-yyyy-yyyy
AZURE_CLIENT_ID=zzzz-zzzz-zzzz
AZURE_CLIENT_SECRET=secret123...
AZURE_CONTAINER_REGISTRY=eventmanagement
AZURE_RESOURCE_GROUP=rg-event-management-prod
```

**Add these to GitHub:**

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the list above
5. Click **Add secret**

**Or use GitHub CLI:**
```powershell
gh secret set AZURE_SUBSCRIPTION_ID --body "xxxx-xxxx-xxxx"
gh secret set AZURE_TENANT_ID --body "yyyy-yyyy-yyyy"
gh secret set AZURE_CLIENT_ID --body "zzzz-zzzz-zzzz"
gh secret set AZURE_CLIENT_SECRET --body "secret123..."
gh secret set AZURE_CONTAINER_REGISTRY --body "eventmanagement"
gh secret set AZURE_RESOURCE_GROUP --body "rg-event-management-prod"
```

---

### **Step 5: Trigger First Deployment**

Make a commit and push to deploy:

```powershell
# Add all changes
git add .

# Commit
git commit -m "ci: initialize GitHub and Azure deployment"

# Push to main (triggers production deployment)
git push origin main
```

**What happens automatically:**
1. GitHub Actions workflow starts
2. Builds backend and frontend
3. Runs tests
4. Builds Docker images
5. Pushes to Azure Container Registry
6. Updates Container Apps with new images
7. App goes live! 🎉

---

### **Step 6: Monitor Deployment**

**Watch in GitHub:**
1. Go to repository → **Actions** tab
2. Click on the workflow run
3. View real-time logs

**Check Container Apps:**
```powershell
# View deployment status
az containerapp show \
  --resource-group rg-event-management-prod \
  --name event-management-backend \
  --query properties.provisioningState

# View running replicas
az containerapp show \
  --resource-group rg-event-management-prod \
  --name event-management-frontend \
  --query "properties.template.scale"

# View recent logs
az containerapp logs show \
  --resource-group rg-event-management-prod \
  --name event-management-backend \
  --follow
```

---

### **Step 7: Access Your Application**

After successful deployment, you can access:

**Frontend (Web Application):**
```
https://<your-frontend-container-app-url>
```

**Admin Panel:**
```
https://<your-frontend-url>/admin-login
```

**Backend API:**
```
https://<your-backend-container-app-url>/api
```

**Test Login:**
- Email: `admin@eventms.com`
- Password: `Admin@123`

---

## Branch Strategy

### Main Branch (`main`)
- **Purpose**: Production
- **Trigger**: Automatic deployment on push
- **Deployment Target**: Production Container Apps
- **Requires**: Pull request review + tests passing

### Staging Branch (`staging`)
- **Purpose**: Pre-production testing
- **Trigger**: Automatic deployment on push
- **Deployment Target**: Staging Container Apps (when configured)
- **Requires**: Pull request review

### Feature Branches
- **Naming**: `feature/name`, `bugfix/name`, `refactor/name`
- **Branch from**: `main`
- **Create PR to**: `staging` (for testing)
- **Merge**: After testing successful

---

## Workflow Example

```bash
# 1. Start new feature from main
git checkout -b feature/new-invoices main

# 2. Make changes
# ... edit files ...

# 3. Commit changes
git add .
git commit -m "feat: add invoice management features"

# 4. Push feature branch
git push origin feature/new-invoices

# 5. Create Pull Request on GitHub
# (main branch → staging branch)
# - GitHub Actions runs tests automatically
# - Request review from team
# - Tests must pass before merge

# 6. Merge to staging
# - After review approval
# - After all tests pass
# - Automatic deployment to staging environment

# 7. Test in staging
# - Access staging URL
# - Run integration tests
# - Verify functionality

# 8. Create PR from staging → main
# - Final review
# - Merge to main
# - Automatic production deployment!
```

---

## What Gets Deployed

### On Every Push to `main`:

```
1. Build Stage (Parallel)
   ├─ Compile NestJS backend
   ├─ Compile React/Vite frontend
   └─ Run linters

2. Test Stage
   ├─ Backend unit tests
   ├─ Frontend unit tests
   └─ Integration tests with PostgreSQL

3. Push Images (Only if tests pass)
   ├─ Build backend Docker image
   ├─ Build frontend Docker image
   └─ Push to Azure Container Registry

4. Deploy (Only on main branch)
   ├─ Update backend Container App
   ├─ Update frontend Container App
   ├─ Verify deployments
   └─ Health checks
```

### Deployment Details:

**Backend:**
- Service: NestJS API
- Port: 3000
- Replicas: 2-10 (auto-scales)
- Database: PostgreSQL 16

**Frontend:**
- Service: React + Nginx
- Port: 80/443
- Replicas: 2-5 (auto-scales)
- API Proxy: `/api` → Backend

---

## Environment Configuration

### Automatic Configuration

The Bicep template automatically configures:

| Service | Configuration |
|---------|---------------|
| Backend | DATABASE_URL, JWT_SECRET, NODE_ENV |
| Frontend | VITE_API_URL (auto-set to backend) |
| Database | Connection pooling, SSL required |
| Redis | 7GB storage, TLS enabled |
| Monitoring | Application Insights, Log Analytics |

### To Add More Environment Variables

Edit `infra/main.bicep` in the `env` section of each container app.

---

## Monitoring & Logs

### View Logs

```powershell
# Backend logs
az containerapp logs show \
  --resource-group rg-event-management-prod \
  --name event-management-backend \
  --follow

# Frontend logs
az containerapp logs show \
  --resource-group rg-event-management-prod \
  --name event-management-frontend \
  --follow
```

### Application Insights

1. Go to Azure Portal
2. Navigate to Application Insights resource
3. View:
   - Performance metrics
   - Failed requests
   - Dependencies
   - Custom events
   - Exceptions

### Azure Monitor

```powershell
# Query logs with KQL
az monitor log-analytics query \
  --workspace "event-management-law-prod" \
  --analytics-query "ContainerAppConsoleLogs_CL | tail 100"
```

---

## Cost Optimization

**Estimated Monthly Cost**: $145-220

### Cost Breakdown:
```
Container Registry:     $5
Container Apps (2):     $50-60
PostgreSQL:             $50-70
Redis:                  $30-50
Application Insights:   $10-20
Log Analytics:          $10-20
─────────────────
Total:                  $145-220
```

### Ways to Reduce Costs:
1. Use Reserved Instances for databases
2. Reduce max replicas during off-peak hours
3. Optimize log retention (currently 30 days)
4. Use scheduled scaling with Azure Functions

---

## Troubleshooting

### GitHub Actions Failing?

```powershell
# Check logs in GitHub Actions tab
# Common issues:

# 1. Secrets not set
gh secret list

# 2. Build errors
# Check .github/workflows/deploy.yml

# 3. Docker build failures
# Run locally: docker build -f Dockerfile.prod .
```

### Azure Deployment Failed?

```powershell
# Check deployment status
az deployment group list \
  --resource-group rg-event-management-prod \
  --query "[0].properties"

# View error details
az deployment operation list \
  --resource-group rg-event-management-prod \
  --name <deployment-name>
```

### Can't Access Application?

```powershell
# Check if container app is running
az containerapp show \
  --resource-group rg-event-management-prod \
  --name event-management-frontend \
  --query properties

# Check networking/ingress
az containerapp show \
  --name event-management-frontend \
  --resource-group rg-event-management-prod \
  --query properties.configuration.ingress
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| `CI-CD-QUICKSTART.md` | 5-step quick start |
| `CI-CD-DEPLOYMENT-GUIDE.md` | Complete 50+ page guide |
| `GITHUB-AZURE-SETUP.md` | GitHub & Azure setup details |
| `.github/workflows/deploy.yml` | GitHub Actions workflow |
| `infra/main.bicep` | Azure infrastructure code |
| `infra/deploy.ps1` | Azure deployment script |
| `deploy-all.ps1` | Automated GitHub + Azure setup |

---

## Quick Commands Reference

```powershell
# Git commands
git status                          # Check status
git push origin main                # Push to main (triggers deployment)
git push origin staging              # Push to staging
git checkout -b feature/name         # Create feature branch
git branch -v                        # List branches

# Azure commands
az containerapp logs show \
  --resource-group rg-event-management-prod \
  --name event-management-backend \
  --follow                           # View backend logs

az containerapp show \
  --resource-group rg-event-management-prod \
  --name event-management-backend    # Check deployment status

# GitHub commands (if CLI installed)
gh secret list                       # View all secrets
gh run list                          # List recent workflow runs
gh run view <run-id> --log          # View workflow logs
```

---

## Success Indicators

✅ **You'll know it's working when:**
1. GitHub repository is created and code is pushed
2. `.github/workflows/deploy.yml` appears in Actions tab
3. Workflow runs and shows "Build", "Test", "Push Images", "Deploy" stages
4. All stages complete with green checkmarks
5. Container Apps show "Succeeded" provisioning state
6. Application is accessible at the Frontend URL
7. Can login with `admin@eventms.com` / `Admin@123`
8. Logs appear in Application Insights

---

## Next Steps

1. ✅ **Create GitHub repository** (manual or CLI)
2. ✅ **Push code to GitHub** (`git push -u origin main`)
3. ✅ **Run Azure deployment** (`.\deploy-all.ps1`)
4. ✅ **Add GitHub Secrets** (from deployment output)
5. ✅ **Make test commit** (`git push origin main`)
6. ✅ **Monitor deployment** (GitHub Actions tab)
7. ✅ **Access application** (Frontend URL)
8. ✅ **Start development** (create feature branches)

---

**Estimated Total Time**: 30-45 minutes

**Support**: Check the documentation files or Azure/GitHub official docs.

**Ready to deploy?** Start with Step 1! 🚀
