#!/bin/bash

# Bash deployment script for Linux/Mac

echo -e "\033[32mReact-Node Calculator AWS Deployment Script\033[0m"
echo -e "\033[32m============================================\033[0m"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "\033[31mAWS CLI is not installed. Please install it first.\033[0m"
    echo -e "\033[33mInstall using: pip install awscli or brew install awscli\033[0m"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "\033[31mTerraform is not installed. Please install it first.\033[0m"
    echo -e "\033[33mDownload from: https://www.terraform.io/downloads\033[0m"
    exit 1
fi

# Initialize Terraform
echo -e "\n\033[36mStep 1: Initializing Terraform...\033[0m"
cd terraform
terraform init

if [ $? -ne 0 ]; then
    echo -e "\033[31mTerraform initialization failed!\033[0m"
    exit 1
fi

# Plan Terraform deployment
echo -e "\n\033[36mStep 2: Planning Terraform deployment...\033[0m"
terraform plan -out=tfplan

if [ $? -ne 0 ]; then
    echo -e "\033[31mTerraform plan failed!\033[0m"
    exit 1
fi

# Apply Terraform configuration
echo -e "\n\033[36mStep 3: Applying Terraform configuration...\033[0m"
terraform apply tfplan

if [ $? -ne 0 ]; then
    echo -e "\033[31mTerraform apply failed!\033[0m"
    exit 1
fi

# Get outputs
echo -e "\n\033[36mStep 4: Getting deployment outputs...\033[0m"
API_URL=$(terraform output -raw api_gateway_url)
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
WEBSITE_URL=$(terraform output -raw website_url)

# Update React app with API Gateway URL
echo -e "\n\033[36mStep 5: Updating React app configuration...\033[0m"
cd ../client
echo "REACT_APP_API_URL=$API_URL" > .env.production

# Build React app
echo -e "\n\033[36mStep 6: Building React app...\033[0m"
npm run build

if [ $? -ne 0 ]; then
    echo -e "\033[31mReact build failed!\033[0m"
    exit 1
fi

# Deploy to S3
echo -e "\n\033[36mStep 7: Deploying React app to S3...\033[0m"
aws s3 sync build/ s3://$BUCKET_NAME --delete

if [ $? -ne 0 ]; then
    echo -e "\033[31mS3 deployment failed!\033[0m"
    exit 1
fi

# Display results
echo -e "\n\033[32m============================================\033[0m"
echo -e "\033[32mDeployment Complete!\033[0m"
echo -e "\033[32m============================================\033[0m"
echo -e "\033[33mAPI Gateway URL: $API_URL\033[0m"
echo -e "\033[33mWebsite URL: $WEBSITE_URL\033[0m"
echo -e "\n\033[32mYour application is now live!\033[0m"

cd ..