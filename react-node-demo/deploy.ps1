# PowerShell deployment script for Windows

Write-Host "React-Node Calculator AWS Deployment Script" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "AWS CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check if Terraform is installed
if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
    Write-Host "Terraform is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Download from: https://www.terraform.io/downloads" -ForegroundColor Yellow
    exit 1
}

# Initialize Terraform
Write-Host "`nStep 1: Initializing Terraform..." -ForegroundColor Cyan
Set-Location -Path terraform
terraform init

if ($LASTEXITCODE -ne 0) {
    Write-Host "Terraform initialization failed!" -ForegroundColor Red
    exit 1
}

# Plan Terraform deployment
Write-Host "`nStep 2: Planning Terraform deployment..." -ForegroundColor Cyan
terraform plan -out=tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Host "Terraform plan failed!" -ForegroundColor Red
    exit 1
}

# Apply Terraform configuration
Write-Host "`nStep 3: Applying Terraform configuration..." -ForegroundColor Cyan
terraform apply tfplan

if ($LASTEXITCODE -ne 0) {
    Write-Host "Terraform apply failed!" -ForegroundColor Red
    exit 1
}

# Get outputs
Write-Host "`nStep 4: Getting deployment outputs..." -ForegroundColor Cyan
$apiUrl = terraform output -raw api_gateway_url
$bucketName = terraform output -raw s3_bucket_name
$websiteUrl = terraform output -raw website_url

# Update React app with API Gateway URL
Write-Host "`nStep 5: Updating React app configuration..." -ForegroundColor Cyan
Set-Location -Path ../client
$envContent = "REACT_APP_API_URL=$apiUrl"
Set-Content -Path .env.production -Value $envContent

# Build React app
Write-Host "`nStep 6: Building React app..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "React build failed!" -ForegroundColor Red
    exit 1
}

# Deploy to S3
Write-Host "`nStep 7: Deploying React app to S3..." -ForegroundColor Cyan
aws s3 sync build/ s3://$bucketName --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "S3 deployment failed!" -ForegroundColor Red
    exit 1
}

# Display results
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "API Gateway URL: $apiUrl" -ForegroundColor Yellow
Write-Host "Website URL: $websiteUrl" -ForegroundColor Yellow
Write-Host "`nYour application is now live!" -ForegroundColor Green

Set-Location -Path ..