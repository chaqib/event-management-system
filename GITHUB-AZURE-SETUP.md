# GitHub & Azure Deployment Setup

## ✅ Completed Locally

Your project is now initialized with git and has the following structure:

```
Branches:
  - main        (production)
  - staging     (pre-production testing)

Commits:
  Initial commit with full Event Management System code + CI/CD pipeline
```

## 📋 Next Steps

### Step 1: Create GitHub Repository (If Not Exists)

**Option A: Via GitHub Web UI**
1. Go to https://github.com/new
2. Create repository name: `event-management-system`
3. Do NOT initialize with README (we already have files)
4. Click "Create repository"
5. Copy the repository URL (HTTPS or SSH)

**Option B: Via GitHub CLI**
```powershell
gh repo create event-management-system --public --source=. --push --remote=origin
```

### Step 2: Add GitHub Remote & Push

```powershell
cd c:\Users\MuhammadAqib\Desktop\event-management-system

# Add remote (replace with your actual repo URL)
git remote add origin https://github.com/YOUR_USERNAME/event-management-system.git
# OR for SSH:
# git remote add origin git@github.com:YOUR_USERNAME/event-management-system.git

# Push main branch
git push -u origin main

# Push staging branch
git push -u origin staging

# Verify
git branch -v
git remote -v
```

### Step 3: Configure GitHub Branch Protection

1. Go to repository Settings → Branches
2. Create branch protection rule for `main`:
   - Require pull request reviews
   - Require status checks to pass (GitHub Actions)
   - Require branches to be up to date
3. Create branch protection rule for `staging`:
   - Require pull request reviews
   - Allow force pushes (optional for staging)

### Step 4: Deploy Azure Infrastructure

```powershell
cd c:\Users\MuhammadAqib\Desktop\event-management-system\infra

# Run deployment script
.\deploy.ps1

# When prompted:
# - Subscription ID: Your Azure subscription
# - Resource Group: rg-event-management-prod
# - Database Password: Strong 12+ character password
# - Location: eastus
```

**The script will:**
- Create Resource Group
- Deploy Container Registry
- Deploy Container Apps Environment
- Deploy PostgreSQL Database
- Deploy Redis Cache
- Deploy Application Insights
- Create Service Principal for GitHub
- Output all necessary values

### Step 5: Save Azure Deployment Outputs

The script will display:
```
Container Registry URL: <your-registry>.azurecr.io
Backend URL: https://<backend>.azurecontainerapps.io
Frontend URL: https://<frontend>.azurecontainerapps.io
PostgreSQL FQDN: event-management-db-prod.postgres.database.azure.com
Redis Hostname: event-management-redis-prod.redis.cache.windows.net
```

**Also output Service Principal credentials:**
```
AZURE_CLIENT_ID: <client-id>
AZURE_TENANT_ID: <tenant-id>
```

Save these values!

### Step 6: Add GitHub Secrets

Go to GitHub Repository → Settings → Secrets and variables → Actions

Add these secrets with values from Azure deployment:

```
AZURE_SUBSCRIPTION_ID=<your-subscription-id>
AZURE_TENANT_ID=<from-deployment-output>
AZURE_CLIENT_ID=<from-deployment-output>
AZURE_CLIENT_SECRET=<from-deployment-output>
AZURE_CONTAINER_REGISTRY=<registry-name-without-.azurecr.io>
AZURE_RESOURCE_GROUP=rg-event-management-prod
```

### Step 7: Verify GitHub Actions Setup

1. Go to repository Actions tab
2. You should see `.github/workflows/deploy.yml` workflow
3. It will automatically run on:
   - Push to `main` → Deploy to production
   - Push to `staging` → Deploy to staging
   - Push to `develop` → Run tests only
   - Pull requests → Run tests only

## 🚀 Deployment Workflow

### Development → Staging → Production

```
1. Create feature branch from main
   git checkout -b feature/my-feature main

2. Make changes and commit
   git add .
   git commit -m "feat: add my feature"
   git push origin feature/my-feature

3. Create Pull Request to staging
   - GitHub will run tests
   - Review code
   - Merge to staging

4. Staging deployment runs automatically
   - Backend updates to staging environment
   - Frontend updates to staging environment
   - Test at: https://<staging-frontend-url>

5. After testing, create PR from staging → main
   - Final review
   - Merge to main

6. Production deployment runs automatically
   - Creates/tags images in registry
   - Updates production Container Apps
   - App goes live!
```

## 📊 CI/CD Pipeline Details

The GitHub Actions workflow (`.github/workflows/deploy.yml`) includes:

### Build Stage
- ✅ Checkout code
- ✅ Setup Node.js 20
- ✅ Install backend dependencies
- ✅ Build NestJS backend
- ✅ Lint backend code
- ✅ Install frontend dependencies
- ✅ Build React/Vite frontend
- ✅ Lint frontend code
- ✅ Upload artifacts

### Test Stage
- ✅ Start PostgreSQL test database
- ✅ Run backend tests
- ✅ Run frontend tests
- ✅ Generate test reports

### Push Images (Main branch only)
- ✅ Azure authentication
- ✅ Build backend Docker image
- ✅ Build frontend Docker image
- ✅ Push to Azure Container Registry
- ✅ Tag with commit SHA + `latest`

### Deploy (Main branch only)
- ✅ Update backend container app
- ✅ Update frontend container app
- ✅ Verify deployment status
- ✅ Check running replicas

## 🌐 Access Your Application

After successful deployment:

```
Frontend:  https://<frontend-container-app-url>
Backend:   https://<backend-container-app-url>
Admin:     https://<frontend-url>/admin-login
```

**Test Credentials:**
- Email: admin@eventms.com
- Password: Admin@123

## 📈 Monitoring

View deployments and logs:

```powershell
# Check deployment status
az containerapp show \
  --resource-group rg-event-management-prod \
  --name event-management-backend \
  --query properties.provisioningState

# View logs
az containerapp logs show \
  --resource-group rg-event-management-prod \
  --name event-management-backend \
  --follow

# Check GitHub Actions
gh run list
gh run view <run-id> --log
```

## 🔧 Environment-Specific Configuration

### Staging Environment

1. Create separate Azure resources:
```powershell
# Modify infra/deploy.ps1 to use:
# - Resource Group: rg-event-management-staging
# - Environment: staging
```

2. Create separate branch protection rules

3. Modify GitHub Actions to deploy to staging Container Apps

### Production Environment

Current setup deploys to production on `main` branch merge.

## 💡 Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Use feature branches** - Create PR for any change
3. **Require reviews** - Set branch protection rules
4. **Monitor deployments** - Check Application Insights
5. **Backup databases** - PostgreSQL auto-backups (7 days)
6. **Scale as needed** - Adjust Container Apps replicas

## 🆘 Troubleshooting

### GitHub Actions Failing

```powershell
# Check secret configuration
gh secret list

# Rebuild action cache
git commit --allow-empty -m "rebuild"
git push
```

### Azure Deployment Issues

```powershell
# Check container app status
az containerapp show \
  --resource-group rg-event-management-prod \
  --name event-management-backend

# Check recent revisions
az containerapp revision list \
  --resource-group rg-event-management-prod \
  --name event-management-backend
```

### Database Connection Issues

```powershell
# Test PostgreSQL connection
az postgres flexible-server connect \
  --name event-management-db-prod \
  --resource-group rg-event-management-prod \
  --admin-user dbadmin
```

## 📚 Documentation

- **Full CI/CD Guide**: `CI-CD-DEPLOYMENT-GUIDE.md`
- **Quick Start**: `CI-CD-QUICKSTART.md`
- **GitHub Actions**: `.github/workflows/deploy.yml`
- **Azure Infrastructure**: `infra/main.bicep`

## 📋 Checklist

```
GitHub Setup:
  [ ] Create GitHub repository
  [ ] Add remote: git remote add origin <url>
  [ ] Push main branch: git push -u origin main
  [ ] Push staging branch: git push -u origin staging
  [ ] Configure branch protection rules

Azure Deployment:
  [ ] Run infra/deploy.ps1
  [ ] Save deployment outputs
  [ ] Create Service Principal (script does this)

GitHub Secrets:
  [ ] Add AZURE_SUBSCRIPTION_ID
  [ ] Add AZURE_TENANT_ID
  [ ] Add AZURE_CLIENT_ID
  [ ] Add AZURE_CLIENT_SECRET
  [ ] Add AZURE_CONTAINER_REGISTRY
  [ ] Add AZURE_RESOURCE_GROUP

Verification:
  [ ] GitHub Actions workflow exists
  [ ] Secrets are configured
  [ ] First push triggers deployment
  [ ] Application is accessible
```

## 🎯 Next Steps

1. Create GitHub repository
2. Push code to GitHub
3. Run Azure deployment script
4. Configure GitHub secrets
5. Make a test commit to verify pipeline
6. Monitor first deployment
7. Access your live application!

---

**Questions?** Check the detailed guides or Azure/GitHub documentation.

**Ready to deploy?** Follow the steps above in order.

**Estimated time**: 20-30 minutes total
