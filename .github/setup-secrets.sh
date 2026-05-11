#!/bin/bash
# GitHub Actions Secrets Setup Script
# This script helps configure GitHub secrets for CI/CD

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}GitHub Actions Secrets Setup${NC}"
echo "======================================"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI is not installed${NC}"
    echo "Install it from: https://cli.github.com"
    exit 1
fi

# Check authentication
if ! gh auth status &> /dev/null; then
    echo "Please authenticate with GitHub:"
    gh auth login
fi

# Get repository information
REPO=$(gh repo view --json nameWithOwner --query nameWithOwner)
echo -e "${GREEN}Repository: $REPO${NC}"
echo ""

# Prompt for values
read -p "Enter Azure Subscription ID: " SUBSCRIPTION_ID
read -p "Enter Azure Tenant ID: " TENANT_ID
read -p "Enter Service Principal Client ID: " CLIENT_ID
read -sp "Enter Service Principal Client Secret: " CLIENT_SECRET
echo ""
read -p "Enter Azure Container Registry Name: " REGISTRY_NAME
read -p "Enter Azure Resource Group Name: " RESOURCE_GROUP

# Set secrets
echo ""
echo -e "${YELLOW}Setting GitHub secrets...${NC}"

gh secret set AZURE_SUBSCRIPTION_ID --body "$SUBSCRIPTION_ID" --repo "$REPO"
echo -e "${GREEN}✓ AZURE_SUBSCRIPTION_ID${NC}"

gh secret set AZURE_TENANT_ID --body "$TENANT_ID" --repo "$REPO"
echo -e "${GREEN}✓ AZURE_TENANT_ID${NC}"

gh secret set AZURE_CLIENT_ID --body "$CLIENT_ID" --repo "$REPO"
echo -e "${GREEN}✓ AZURE_CLIENT_ID${NC}"

gh secret set AZURE_CLIENT_SECRET --body "$CLIENT_SECRET" --repo "$REPO"
echo -e "${GREEN}✓ AZURE_CLIENT_SECRET${NC}"

gh secret set AZURE_CONTAINER_REGISTRY --body "$REGISTRY_NAME" --repo "$REPO"
echo -e "${GREEN}✓ AZURE_CONTAINER_REGISTRY${NC}"

gh secret set AZURE_RESOURCE_GROUP --body "$RESOURCE_GROUP" --repo "$REPO"
echo -e "${GREEN}✓ AZURE_RESOURCE_GROUP${NC}"

echo ""
echo -e "${GREEN}✓ All secrets configured successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Commit and push your code: git push origin main"
echo "2. Monitor deployment: gh run list"
echo "3. View logs: gh run view <run-id>"
