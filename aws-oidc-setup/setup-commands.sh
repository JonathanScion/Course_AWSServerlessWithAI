#!/bin/bash

# OIDC Setup Commands for AWS
# Run these commands to create the IAM role with OIDC

echo "Setting up OIDC for GitHub Actions..."
echo ""
echo "BEFORE RUNNING: Replace these variables:"
echo "  - YOUR_AWS_ACCOUNT_ID"
echo "  - YOUR_GITHUB_USERNAME"
echo ""
read -p "Press Enter to continue..."

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo ""

# Step 1: Create OIDC Provider (run once per AWS account)
echo "Step 1: Creating OIDC Provider..."
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

echo ""
echo "Step 2: Update trust-policy.json with your Account ID and GitHub username"
echo "Replace YOUR_AWS_ACCOUNT_ID with: $AWS_ACCOUNT_ID"
echo "Replace YOUR_GITHUB_USERNAME with your GitHub username"
echo ""
read -p "Press Enter after updating trust-policy.json..."

# Step 3: Create IAM Role
echo "Step 3: Creating IAM Role..."
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://trust-policy.json

# Step 4: Attach permissions
echo "Step 4: Attaching permissions policy..."
aws iam put-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-name GitHubActionsDeployPolicy \
  --policy-document file://permissions-policy.json

echo ""
echo "✅ Setup complete!"
echo ""
echo "Role ARN:"
aws iam get-role --role-name GitHubActionsDeployRole --query Role.Arn --output text

echo ""
echo "Next steps:"
echo "1. Copy the Role ARN above"
echo "2. Add it as a GitHub secret: AWS_ROLE_ARN"
echo "3. The updated workflow will use OIDC authentication"
