#!/usr/bin/env pwsh
# Complete GitHub + Azure Deployment Setup Script
# This script automates the entire deployment process

param(
    [string]$GitHubToken = "",
    [string]$GitHubUsername = "",
    [string]$RepositoryName = "event-management-system",
    [switch]$SkipGitHub = $false,
    [switch]$SkipAzure = $false
)

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-Header {
    param([string]$Message)
    Write-Host "`n$Blue╔════════════════════════════════════════════════════════════╗$Reset"
    Write-Host "$Blue║ $Message$Reset"
    Write-Host "$Blue╚════════════════════════════════════════════════════════════╝$Reset"
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n$Yellow➜ $Message$Reset"
}

function Write-Success {
    param([string]$Message)
    Write-Host "$Green✓ $Message$Reset"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "$Red✗ $Message$Reset" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "$Blue ℹ $Message$Reset"
}

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot

# Start
Write-Header "Event Management System - GitHub & Azure Deployment"

# Check prerequisites
Write-Step "Checking prerequisites..."

$prereqs = @{
    'git' = 'Git not found. Install from: https://git-scm.com/download/win'
    'az' = 'Azure CLI not found. Install from: https://aka.ms/azure-cli'
}

$missingPrereqs = @()
foreach ($cmd in $prereqs.Keys) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        $missingPrereqs += $cmd
        Write-Error-Custom "$cmd not found: $($prereqs[$cmd])"
    } else {
        Write-Success "$cmd is installed"
    }
}

if ($missingPrereqs.Count -gt 0) {
    Write-Error-Custom "Please install missing prerequisites and try again"
    exit 1
}

# GitHub Setup
if (-not $SkipGitHub) {
    Write-Header "GitHub Setup"

    Write-Step "Checking GitHub CLI..."
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        Write-Success "GitHub CLI is installed"
        
        # Check if logged in
        if (-not (gh auth status 2>&1)) {
            Write-Step "Please authenticate with GitHub..."
            & gh auth login
        } else {
            Write-Success "Already authenticated with GitHub"
        }
    } else {
        Write-Info "GitHub CLI not installed. You'll need to add remote manually:"
        Write-Info "git remote add origin <your-repository-url>"
        Write-Info "git push -u origin main"
        Write-Info "git push -u origin staging"
    }

    Write-Step "Creating/using GitHub repository..."
    $repoUrl = ""
    
    # Try to create with gh if available
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        try {
            Write-Info "Creating repository: $RepositoryName"
            & gh repo create $RepositoryName --public --source="$ProjectRoot" --push --remote=origin 2>&1 | Out-Null
            Write-Success "Repository created and code pushed"
            $repoUrl = "https://github.com/$(gh api user -q .login)/$RepositoryName"
        } catch {
            Write-Info "Repository may already exist, proceeding with existing remote"
        }
    } else {
        Write-Info "Please create repository manually at https://github.com/new"
        $repoUrl = Read-Host "Enter your repository URL (HTTPS)"
        
        if ([string]::IsNullOrEmpty($repoUrl)) {
            Write-Error-Custom "Repository URL is required"
            exit 1
        }

        Set-Location $ProjectRoot
        git remote add origin $repoUrl
        Write-Step "Pushing to GitHub..."
        git push -u origin main
        git push -u origin staging
        Write-Success "Code pushed to GitHub"
    }

    Write-Step "Repository ready!"
    if (-not [string]::IsNullOrEmpty($repoUrl)) {
        Write-Info "Repository: $repoUrl"
    }
}

# Azure Setup
if (-not $SkipAzure) {
    Write-Header "Azure Infrastructure Deployment"

    Write-Step "Checking Azure authentication..."
    $currentContext = (az account show --query id -o tsv 2>/dev/null)
    
    if ([string]::IsNullOrEmpty($currentContext)) {
        Write-Step "Please login to Azure..."
        & az login | Out-Null
        $currentContext = (az account show --query id -o tsv)
    }
    
    Write-Success "Logged in to Azure"
    Write-Info "Subscription ID: $currentContext"

    # Gather inputs
    Write-Step "Gathering deployment parameters..."
    
    $subscriptionId = $currentContext
    $tenantId = (az account show --query tenantId -o tsv)
    $location = "eastus"
    $resourceGroup = "rg-event-management-prod"
    $environment = "prod"
    $appName = "event-management"

    Write-Info "Location: $location"
    Write-Info "Resource Group: $resourceGroup"
    Write-Info "App Name: $appName"
    Write-Info "Environment: $environment"

    # Get or create database password
    Write-Step "Setting up database password..."
    $securePassword = Read-Host "Enter PostgreSQL admin password (12+ chars)" -AsSecureString
    $dbPassword = [System.Net.NetworkCredential]::new('', $securePassword).Password

    if ($dbPassword.Length -lt 12) {
        Write-Error-Custom "Password must be at least 12 characters"
        exit 1
    }

    Write-Success "Password set"

    # Create resource group
    Write-Step "Creating resource group: $resourceGroup"
    $rgExists = (az group exists --name $resourceGroup)
    
    if ($rgExists -eq "true") {
        Write-Success "Resource group already exists"
    } else {
        az group create --name $resourceGroup --location $location | Out-Null
        Write-Success "Resource group created"
    }

    # Deploy infrastructure
    Write-Step "Deploying Azure infrastructure (this may take 5-10 minutes)..."
    Write-Info "Deploying: Container Registry, Container Apps, PostgreSQL, Redis, Monitoring..."

    $bicepFile = Join-Path $ProjectRoot "infra\main.bicep"
    
    if (-not (Test-Path $bicepFile)) {
        Write-Error-Custom "Bicep file not found: $bicepFile"
        exit 1
    }

    $parametersJson = @{
        "`$schema" = "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#"
        contentVersion = "1.0.0.0"
        parameters = @{
            location = @{ value = $location }
            environment = @{ value = $environment }
            appName = @{ value = $appName }
            databaseAdminUser = @{ value = "dbadmin" }
            databasePassword = @{ value = $dbPassword }
        }
    }

    $parametersFile = Join-Path $ProjectRoot "infra\parameters.json"
    $parametersJson | ConvertTo-Json -Depth 10 | Set-Content $parametersFile

    try {
        $deployment = (az deployment group create `
            --resource-group $resourceGroup `
            --template-file $bicepFile `
            --parameters $parametersFile `
            --output json | ConvertFrom-Json)

        if ($deployment.properties.provisioningState -eq "Succeeded") {
            Write-Success "Azure infrastructure deployed successfully"

            # Extract outputs
            $outputs = $deployment.properties.outputs
            
            Write-Header "Deployment Outputs"
            
            $containerRegistryUrl = $outputs.containerRegistryUrl.value
            $backendUrl = $outputs.backendUrl.value
            $frontendUrl = $outputs.frontendUrl.value
            $postgresqlFqdn = $outputs.postgresqlFqdn.value
            $redisCacheHostname = $outputs.redisCacheHostname.value

            Write-Info "Frontend URL: $frontendUrl"
            Write-Info "Backend URL: $backendUrl"
            Write-Info "Container Registry: $containerRegistryUrl"
            Write-Info "PostgreSQL: $postgresqlFqdn"
            Write-Info "Redis: $redisCacheHostname"

            # Get service principal
            Write-Step "Creating Service Principal for GitHub..."
            $spName = "github-$appName-$environment"
            
            try {
                $sp = (az ad sp create-for-rbac `
                    --name $spName `
                    --role "Contributor" `
                    --scopes "/subscriptions/$subscriptionId" `
                    --output json | ConvertFrom-Json)

                Write-Success "Service Principal created"
                
                Write-Header "GitHub Secrets to Configure"
                Write-Info "Add these to your GitHub repository (Settings > Secrets > Actions):"
                Write-Host "`nAZURE_SUBSCRIPTION_ID=$subscriptionId"
                Write-Host "AZURE_TENANT_ID=$($sp.tenantId)"
                Write-Host "AZURE_CLIENT_ID=$($sp.clientId)"
                Write-Host "AZURE_CLIENT_SECRET=$($sp.password)"
                Write-Host "AZURE_CONTAINER_REGISTRY=$(($containerRegistryUrl -split '\.')[0])"
                Write-Host "AZURE_RESOURCE_GROUP=$resourceGroup"
                
                # Save to file
                $secretsFile = Join-Path $ProjectRoot ".env.azure"
                @"
AZURE_SUBSCRIPTION_ID=$subscriptionId
AZURE_TENANT_ID=$($sp.tenantId)
AZURE_CLIENT_ID=$($sp.clientId)
AZURE_CLIENT_SECRET=$($sp.password)
AZURE_CONTAINER_REGISTRY=$(($containerRegistryUrl -split '\.')[0])
AZURE_RESOURCE_GROUP=$resourceGroup
"@ | Set-Content $secretsFile
                
                Write-Success "Secrets saved to .env.azure (keep this secure!)"

            } catch {
                Write-Error-Custom "Failed to create Service Principal: $_"
            }

        } else {
            Write-Error-Custom "Deployment failed: $($deployment.properties.provisioningState)"
            Write-Host $deployment | ConvertTo-Json -Depth 5
            exit 1
        }
    } catch {
        Write-Error-Custom "Azure deployment error: $_"
        exit 1
    }
}

# Final steps
Write-Header "Setup Complete!"

Write-Success "Your infrastructure is ready for deployment"

Write-Step "Next steps:"
Write-Info "1. Add GitHub Secrets (see above)"
Write-Info "2. Commit and push code:"
Write-Host "   cd '$ProjectRoot'"
Write-Host "   git add ."
Write-Host "   git commit -m 'ci: prepare for Azure deployment'"
Write-Host "   git push origin main"
Write-Info "3. Watch GitHub Actions: https://github.com/YOUR_USERNAME/event-management-system/actions"
Write-Info "4. Access your app at the Frontend URL above"

Write-Info "`nDocumentation:"
Write-Info "- Quick Start: CI-CD-QUICKSTART.md"
Write-Info "- Full Guide: CI-CD-DEPLOYMENT-GUIDE.md"
Write-Info "- Setup Guide: GITHUB-AZURE-SETUP.md"

Write-Host "`n"
