# Azure Infrastructure Deployment Script
# This script deploys the event management system infrastructure to Azure

param(
    [string]$SubscriptionId = $(Read-Host "Enter Azure Subscription ID"),
    [string]$ResourceGroup = $(Read-Host "Enter Resource Group Name"),
    [string]$Location = "eastus",
    [string]$Environment = "prod",
    [string]$AppName = "event-management",
    [string]$BicepTemplatePath = "./infra/main.bicep",
    [string]$ParametersPath = "./infra/parameters.json"
)

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Reset = "`e[0m"

function Write-Header {
    param([string]$Message)
    Write-Host "`n$Yellow=== $Message ===$Reset"
}

function Write-Success {
    param([string]$Message)
    Write-Host "$Green✓ $Message$Reset"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "$Red✗ $Message$Reset" -ForegroundColor Red
}

# Step 1: Login to Azure
Write-Header "Logging in to Azure"
$currentContext = az account show --query id -o tsv 2>/dev/null
if (-not $currentContext) {
    az login
} else {
    Write-Success "Already logged in to Azure"
}

# Step 2: Set subscription
Write-Header "Setting subscription context"
az account set --subscription $SubscriptionId
Write-Success "Subscription set to $SubscriptionId"

# Step 3: Create resource group if it doesn't exist
Write-Header "Creating/Verifying Resource Group"
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "true") {
    Write-Success "Resource Group '$ResourceGroup' already exists"
} else {
    Write-Host "Creating Resource Group '$ResourceGroup'..."
    az group create --name $ResourceGroup --location $Location
    Write-Success "Resource Group created"
}

# Step 4: Validate Bicep template
Write-Header "Validating Bicep template"
az bicep build-params --file $ParametersPath --output-file ./infra/parameters.processed.json 2>&1 | Out-Null
Write-Success "Bicep template validation passed"

# Step 5: Create parameters file with required values
Write-Header "Preparing deployment parameters"
$dbPassword = $(Read-Host -AsSecureString "Enter database password") | ConvertFrom-SecureString -AsPlainText
$parametersJson = Get-Content $ParametersPath | ConvertFrom-Json
$parametersJson.parameters.databasePassword.value = $dbPassword
$parametersJson | ConvertTo-Json | Set-Content ./infra/parameters.processed.json
Write-Success "Parameters prepared"

# Step 6: Deploy infrastructure
Write-Header "Deploying infrastructure to Azure"
Write-Host "This may take 5-10 minutes..."

$deploymentResult = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file $BicepTemplatePath `
    --parameters ./infra/parameters.processed.json `
    --output json | ConvertFrom-Json

if ($deploymentResult.properties.provisioningState -eq "Succeeded") {
    Write-Success "Infrastructure deployment completed successfully"
    
    # Step 7: Extract outputs
    Write-Header "Deployment Outputs"
    $outputs = $deploymentResult.properties.outputs
    
    Write-Host "`nContainer Registry URL: $($outputs.containerRegistryUrl.value)"
    Write-Host "Backend URL: $($outputs.backendUrl.value)"
    Write-Host "Frontend URL: $($outputs.frontendUrl.value)"
    Write-Host "PostgreSQL FQDN: $($outputs.postgresqlFqdn.value)"
    Write-Host "Redis Hostname: $($outputs.redisCacheHostname.value)"
    
    # Save outputs to file
    $outputs | ConvertTo-Json | Out-File "./infra/deployment-outputs.json"
    Write-Success "Outputs saved to deployment-outputs.json"
} else {
    Write-Error-Custom "Infrastructure deployment failed"
    Write-Host "Provisioning State: $($deploymentResult.properties.provisioningState)"
    exit 1
}

# Step 8: Configure GitHub Secrets
Write-Header "Configuring GitHub Secrets"
Write-Host "To complete the CI/CD setup, add these secrets to your GitHub repository:"
Write-Host "$Yellow- AZURE_SUBSCRIPTION_ID: $SubscriptionId$Reset"
Write-Host "$Yellow- AZURE_TENANT_ID: $(az account show --query tenantId -o tsv)$Reset"
Write-Host "$Yellow- AZURE_CLIENT_ID: (create a service principal)$Reset"
Write-Host "$Yellow- AZURE_CONTAINER_REGISTRY: $(($outputs.containerRegistryUrl.value -split '\.')[0])$Reset"
Write-Host "$Yellow- AZURE_RESOURCE_GROUP: $ResourceGroup$Reset"

# Step 9: Create service principal for GitHub
Write-Header "Creating Service Principal for GitHub"
$servicePrincipal = az ad sp create-for-rbac `
    --name "github-$AppName-$Environment" `
    --role "Contributor" `
    --scopes "/subscriptions/$SubscriptionId" `
    --output json | ConvertFrom-Json

Write-Success "Service Principal created"
Write-Host "$Yellow`nAdd these values to GitHub Secrets:$Reset"
Write-Host "AZURE_CLIENT_ID: $($servicePrincipal.clientId)"
Write-Host "AZURE_TENANT_ID: $($servicePrincipal.tenantId)"

Write-Header "Deployment Complete"
Write-Success "Infrastructure is ready for CI/CD deployment"
Write-Host "`nNext steps:"
Write-Host "1. Add GitHub Secrets (see above)"
Write-Host "2. Push code to main branch to trigger deployment"
Write-Host "3. Monitor GitHub Actions for deployment status"
Write-Host "4. Access your application at: $($outputs.frontendUrl.value)"

# Cleanup temporary files
Remove-Item ./infra/parameters.processed.json -Force -ErrorAction SilentlyContinue

Write-Host "`n"
