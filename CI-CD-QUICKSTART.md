# Quick Start: CI/CD Setup

## Overview
This project includes a complete GitHub Actions CI/CD pipeline for deploying to Azure.

## Files Created

```
.github/
  ├─ workflows/
  │   └─ deploy.yml              # Main CI/CD pipeline
  └─ setup-secrets.sh            # Script to configure GitHub secrets

infra/
  ├─ main.bicep                  # Azure infrastructure (Bicep)
  ├─ parameters.json             # Bicep parameters
  └─ deploy.ps1                  # PowerShell deployment script

backend/
  ├─ Dockerfile.prod             # Production Docker image
  └─ .dockerignore               # Docker build optimization

frontend/
  ├─ Dockerfile.prod             # Production Docker image
  └─ .dockerignore               # Docker build optimization

docker-compose.prod.yml          # Production docker-compose for testing
CI-CD-DEPLOYMENT-GUIDE.md        # Complete deployment documentation
```

## Quick Start (5 Steps)

### Step 1: Deploy Azure Infrastructure

```powershell
cd infra
./deploy.ps1
```

When prompted:
- **Subscription ID**: Your Azure subscription
- **Resource Group**: Name like `rg-event-management-prod`
- **Database Password**: Strong password for PostgreSQL
- **Location**: `eastus` (or your preferred region)

The script will output important information including:
- Container Registry URL
- Backend/Frontend URLs
- Database FQDN
- Service Principal credentials

### Step 2: Configure GitHub Secrets

Option A: Automatic (GitHub CLI)
```bash
cd .github
chmod +x setup-secrets.sh
./setup-secrets.sh
```

Option B: Manual
1. Go to GitHub Repo Settings → Secrets → Actions
2. Add these secrets:
   - `AZURE_SUBSCRIPTION_ID`
   - `AZURE_TENANT_ID`
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`
   - `AZURE_CONTAINER_REGISTRY`
   - `AZURE_RESOURCE_GROUP`

### Step 3: Test Locally (Optional)

```powershell
# Build and test with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Test the API
curl http://localhost:3000/api/health

# Test the frontend
open http://localhost
```

### Step 4: Push Code

```bash
git add .
git commit -m "ci: add CI/CD pipeline and Azure deployment"
git push origin main
```

### Step 5: Monitor Deployment

Watch your pipeline in GitHub:
1. Go to **Actions** tab
2. Click on your workflow run
3. View real-time logs
4. After success, your app will be live!

## Pipeline Stages

| Stage | Trigger | Actions |
|-------|---------|---------|
| **Build** | Any push/PR | Build backend & frontend, lint, artifacts |
| **Test** | Always after Build | Unit tests, integration tests |
| **Push Images** | Main branch only | Docker build, push to registry |
| **Deploy** | After Push Images | Update Azure Container Apps |

## Key Resources

- **Deployment Guide**: See [CI-CD-DEPLOYMENT-GUIDE.md](CI-CD-DEPLOYMENT-GUIDE.md)
- **GitHub Actions**: `.github/workflows/deploy.yml`
- **Azure Infrastructure**: `infra/main.bicep`
- **Docker Images**: `backend/Dockerfile.prod` & `frontend/Dockerfile.prod`

## Environment Variables

### Backend (auto-configured in Container App)
- `NODE_ENV=production`
- `DATABASE_URL=<postgres-connection>`
- `JWT_SECRET=<jwt-key>`
- `REDIS_URL=<redis-connection>`

### Frontend (auto-configured via nginx)
- `VITE_API_URL=<backend-url>`

## Troubleshooting

### Actions Failing?
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Ensure Azure subscription has quota available

### Deployment Failing?
```powershell
# Check container app status
az containerapp show \
  --resource-group $ResourceGroup \
  --name event-management-backend \
  --query properties.provisioningState

# View logs
az containerapp logs show \
  --resource-group $ResourceGroup \
  --name event-management-backend \
  --follow
```

### Database Issues?
```powershell
# Test connection
az postgres flexible-server connect \
  --name event-management-db-prod \
  --resource-group $ResourceGroup
```

## Costs

**Estimated Monthly**: $145-220 for production setup

To optimize:
- Reduce max replicas during off-peak hours
- Use Reserved Instances for databases
- Review Log Analytics retention settings

## Next Steps

1. ✅ Configure and deploy infrastructure
2. ✅ Set GitHub secrets
3. ✅ Push code to main
4. ✅ Monitor first deployment
5. Go to your Frontend URL to test the app!

## Support & Documentation

- Full guide: [CI-CD-DEPLOYMENT-GUIDE.md](CI-CD-DEPLOYMENT-GUIDE.md)
- Azure Container Apps: https://learn.microsoft.com/azure/container-apps/
- GitHub Actions: https://docs.github.com/actions
- Bicep Templates: https://learn.microsoft.com/azure/azure-resource-manager/bicep/

---

**Happy Deploying! 🚀**
