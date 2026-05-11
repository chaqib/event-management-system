# Event Management System - CI/CD Pipeline & Azure Deployment Guide

## Overview

This guide provides complete setup instructions for deploying the Event Management System to Azure using GitHub Actions CI/CD pipeline.

## Architecture

```
GitHub Repository
    ↓
GitHub Actions (CI/CD Pipeline)
    ├─ Build Backend (NestJS)
    ├─ Build Frontend (React/Vite)
    ├─ Run Tests
    ├─ Build Docker Images
    └─ Push to Azure Container Registry
         ↓
Azure Container Registry
    ↓
Deploy to Azure Container Apps
    ├─ Backend Container App (3000)
    └─ Frontend Container App (80/443)
         ↓
Supporting Services
    ├─ PostgreSQL Database
    ├─ Redis Cache
    ├─ Application Insights
    └─ Log Analytics Workspace
```

## Prerequisites

- Azure Subscription with Contributor access
- GitHub account with repository access
- Azure CLI installed locally
- PowerShell 7+ (for deployment scripts)
- Docker installed (for local testing)

## Step 1: Set Up Azure Infrastructure

### 1.1 Deploy Infrastructure with Bicep

```powershell
cd ./infra
./deploy.ps1
```

This script will:
- Create a resource group
- Deploy all Azure resources (Container Registry, Container Apps Environment, Databases, etc.)
- Create a Service Principal for GitHub
- Configure initial settings

### 1.2 Required Inputs

When running `deploy.ps1`, you'll be prompted for:
- **Subscription ID**: Your Azure Subscription ID
- **Resource Group Name**: Name for your Azure resource group (e.g., `rg-event-management-prod`)
- **Database Password**: Secure password for PostgreSQL admin
- **Location**: Azure region (default: `eastus`)

### 1.3 Output Information

The script will output:
- Azure Container Registry URL
- Backend Container App URL
- Frontend Container App URL
- PostgreSQL FQDN
- Redis Cache hostname
- Service Principal credentials

Save these values - you'll need them for GitHub Secrets.

## Step 2: Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets → Actions):

### Required Secrets

```
AZURE_SUBSCRIPTION_ID: <subscription-id>
AZURE_TENANT_ID: <tenant-id>
AZURE_CLIENT_ID: <service-principal-client-id>
AZURE_CLIENT_SECRET: <service-principal-password>
AZURE_CONTAINER_REGISTRY: <registry-name>
AZURE_RESOURCE_GROUP: <resource-group-name>
```

### Steps to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from above
5. Click **Add secret**

## Step 3: GitHub Actions Workflow

### Workflow File

The CI/CD pipeline is defined in `.github/workflows/deploy.yml`

### Pipeline Stages

#### 1. **Build Stage** (Always runs on push/PR)
- Checks out code
- Installs dependencies
- Builds backend (NestJS)
- Builds frontend (React/Vite)
- Lints code
- Uploads build artifacts

#### 2. **Test Stage** (Always runs after Build)
- Starts PostgreSQL test database
- Runs backend tests
- Runs frontend tests
- Reports test results

#### 3. **Push Images Stage** (Runs only on main branch)
- Downloads build artifacts
- Builds Docker images
- Pushes to Azure Container Registry
- Tags with commit SHA and `latest`

#### 4. **Deploy Stage** (Runs only on main branch after successful push)
- Authenticates with Azure
- Updates backend container app image
- Updates frontend container app image
- Verifies deployment status

### Trigger Conditions

```yaml
# Pipeline triggers on:
- Push to main/develop branches
- Pull requests against main/develop branches

# Deployment only occurs on:
- Push to main branch (after tests pass)
```

## Step 4: Local Testing

### Test Docker Build Locally

```powershell
# Build backend image
docker build -f backend/Dockerfile.prod -t event-management-backend:test backend

# Build frontend image
docker build -f frontend/Dockerfile.prod -t event-management-frontend:test frontend

# Test with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Test Backend API

```powershell
$token = (Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/auth/login" `
  -Method POST `
  -Body '{"email":"admin@eventms.com","password":"Admin@123"}' `
  -ContentType "application/json").accessToken

Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/invoices" `
  -Headers @{Authorization = "Bearer $token"} `
  -Method GET
```

## Step 5: Deployment Workflow

### Automatic Deployment

1. **Commit and Push Code**
   ```bash
   git add .
   git commit -m "feature: add new feature"
   git push origin main
   ```

2. **Monitor GitHub Actions**
   - Go to **Actions** tab in GitHub
   - Watch pipeline progress through Build → Test → Push → Deploy stages
   - View logs for any issues

3. **Verify Deployment**
   ```powershell
   # Check container app status
   az containerapp show \
     --resource-group $ResourceGroup \
     --name event-management-backend \
     --query properties.provisioningState
   ```

### Manual Deployment

If you need to manually deploy without GitHub:

```powershell
# Build and push images manually
az acr build --registry $RegistryName \
  --image event-management-backend:latest \
  --file backend/Dockerfile.prod backend

# Update container app
az containerapp update \
  --resource-group $ResourceGroup \
  --name event-management-backend \
  --image $RegistryName.azurecr.io/event-management-backend:latest
```

## Step 6: Environment Configuration

### Backend Environment Variables

Container App secrets are configured in `infra/main.bicep`:

| Variable | Source | Description |
|----------|--------|-------------|
| `NODE_ENV` | Hard-coded | Set to `production` |
| `DATABASE_URL` | Secret | PostgreSQL connection string |
| `JWT_SECRET` | Secret | JWT signing key |
| `REDIS_URL` | Optional | Redis connection string |

Update the Bicep file to add/modify environment variables:

```bicep
env: [
  {
    name: 'YOUR_VAR'
    value: 'your-value'
  }
]
```

### Frontend Environment Variables

Frontend environment variables are passed through nginx and available at build time:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (auto-configured) |

## Step 7: Monitoring & Logging

### View Logs

```powershell
# View container app logs
az containerapp logs show \
  --name event-management-backend \
  --resource-group $ResourceGroup \
  --follow

# Query Log Analytics
az monitor log-analytics query \
  --workspace "$WorkspaceId" \
  --analytics-query "ContainerAppConsoleLogs_CL | tail 100"
```

### Application Insights

Access Application Insights:
1. Go to Azure Portal
2. Navigate to Application Insights resource
3. View:
   - Performance metrics
   - Dependency tracking
   - Exception details
   - Custom events

## Step 8: Scaling

### Auto-Scale Configuration

Container Apps are configured with auto-scaling in `infra/main.bicep`:

**Backend:**
- Min replicas: 2
- Max replicas: 10
- Scales based on HTTP concurrent requests

**Frontend:**
- Min replicas: 2
- Max replicas: 5
- Scales based on HTTP concurrent requests

Modify `scale` properties in Bicep for different behavior.

## Troubleshooting

### GitHub Actions Failure

1. Check the **Actions** tab for error logs
2. Common issues:
   - Secrets not configured correctly
   - Docker build failures
   - Test failures
   - Azure authentication issues

### Deployment Issues

```powershell
# Check deployment status
az containerapp show --name event-management-backend \
  --resource-group $ResourceGroup \
  --query properties.provisioningState

# Check recent revision
az containerapp revision list --name event-management-backend \
  --resource-group $ResourceGroup \
  --query "[0].[name, properties.runningStatus]"

# View container logs
az containerapp logs show \
  --name event-management-backend \
  --resource-group $ResourceGroup \
  --follow
```

### Database Connection Issues

```powershell
# Check PostgreSQL is accessible
az postgres flexible-server connect \
  --name event-management-db-prod \
  --resource-group $ResourceGroup \
  --admin-user dbadmin \
  --database event_management

# Verify firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group $ResourceGroup \
  --server-name event-management-db-prod
```

## Cost Optimization

### Recommended Tiers for Production

| Resource | SKU | Monthly Cost (Est.) |
|----------|-----|-------------------|
| Container Registry | Standard | $5 |
| Container Apps | 2 replicas (0.5 CPU, 1 GB) | $40-60 |
| PostgreSQL | Standard_B2s | $50-70 |
| Redis | Standard C1 | $30-50 |
| Application Insights | 1 GB/day | $10-20 |
| Log Analytics | 1 GB/day | $10-20 |
| **Total** | | **$145-220/month** |

### Cost Saving Tips

1. Reduce max replicas during off-peak hours
2. Use scheduled scaling with Azure Functions
3. Enable Reserved Instances for databases
4. Optimize log retention policies

## Maintenance

### Regular Tasks

- **Weekly**: Review logs and performance metrics
- **Monthly**: Update dependencies (`npm update`)
- **Quarterly**: Review Azure costs and scaling policies
- **Annually**: Review security settings and compliance

### Disaster Recovery

PostgreSQL backups are configured with 7-day retention. To restore:

```powershell
az postgres flexible-server restore \
  --name event-management-db-restored \
  --source-server event-management-db-prod \
  --resource-group $ResourceGroup
```

## Additional Resources

- [Azure Container Apps Documentation](https://docs.microsoft.com/en-us/azure/container-apps/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Bicep Template Reference](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/file)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)

## Support

For issues or questions:

1. Check GitHub Actions logs for build/deployment errors
2. Review Azure resource health in Azure Portal
3. Check Application Insights for runtime errors
4. Review database logs in PostgreSQL

---

**Last Updated**: May 11, 2026  
**Version**: 1.0.0
