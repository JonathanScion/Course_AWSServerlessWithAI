# PowerShell Script to Destroy ALL AWS Infrastructure
# Run this from the repository root

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AWS Infrastructure Destruction Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# List of all terraform directories
$terraformDirs = @(
    "test-llms-demo\terraform",
    "upload-file-demo\terraform",
    "react-node-demo\terraform",
    "aws-oidc-setup"
)

# Warning prompt
Write-Host "WARNING: This will destroy ALL AWS resources created by this repository:" -ForegroundColor Red
Write-Host ""
Write-Host "  1. test-llms-demo (Bedrock, OpenSearch Serverless, Lambda, API Gateway)" -ForegroundColor Yellow
Write-Host "  2. upload-file-demo (S3, Lambda, DynamoDB, CloudWatch)" -ForegroundColor Yellow
Write-Host "  3. react-node-demo (Lambda, DynamoDB, API Gateway, CloudFront)" -ForegroundColor Yellow
Write-Host "  4. aws-oidc-setup (IAM Role for GitHub Actions)" -ForegroundColor Yellow
Write-Host ""
Write-Host "This action CANNOT be undone!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Type 'DESTROY' to confirm (case-sensitive)"

if ($confirmation -ne "DESTROY") {
    Write-Host "Aborted. No resources were destroyed." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Starting destruction process..." -ForegroundColor Yellow
Write-Host ""

$successCount = 0
$failCount = 0
$results = @()

foreach ($dir in $terraformDirs) {
    $projectName = Split-Path (Split-Path $dir -Parent) -Leaf
    if ($dir -eq "aws-oidc-setup") {
        $projectName = "aws-oidc-setup"
    }

    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Destroying: $projectName" -ForegroundColor Cyan
    Write-Host "Directory: $dir" -ForegroundColor Gray
    Write-Host "========================================" -ForegroundColor Cyan

    if (-Not (Test-Path $dir)) {
        Write-Host "Directory not found: $dir" -ForegroundColor Red
        $results += [PSCustomObject]@{
            Project = $projectName
            Status = "SKIPPED - Directory not found"
        }
        $failCount++
        continue
    }

    # Change to terraform directory
    Push-Location $dir

    # Check if terraform state exists
    if (-Not (Test-Path ".terraform")) {
        Write-Host "No Terraform state found. Running terraform init..." -ForegroundColor Yellow
        terraform init
    }

    # Run terraform destroy with auto-approve
    Write-Host "Running terraform destroy..." -ForegroundColor Yellow
    terraform destroy -auto-approve

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully destroyed $projectName" -ForegroundColor Green
        $results += [PSCustomObject]@{
            Project = $projectName
            Status = "SUCCESS"
        }
        $successCount++
    } else {
        Write-Host "✗ Failed to destroy $projectName (exit code: $LASTEXITCODE)" -ForegroundColor Red
        $results += [PSCustomObject]@{
            Project = $projectName
            Status = "FAILED"
        }
        $failCount++
    }

    Pop-Location
    Write-Host ""
}

# Clean up CloudWatch Log Groups (optional but recommended)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleaning up CloudWatch Log Groups" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$logGroupPrefixes = @(
    "/aws/lambda/multi-llm-rag-",
    "/aws/lambda/upload-file-demo-",
    "/aws/lambda/react-node-demo-"
)

Write-Host "Searching for old log groups..." -ForegroundColor Yellow

foreach ($prefix in $logGroupPrefixes) {
    $logGroups = aws logs describe-log-groups --log-group-name-prefix $prefix --query 'logGroups[].logGroupName' --output text 2>$null

    if ($logGroups) {
        $logGroupArray = $logGroups -split "`t"
        foreach ($logGroup in $logGroupArray) {
            if ($logGroup.Trim()) {
                Write-Host "Deleting log group: $logGroup" -ForegroundColor Gray
                aws logs delete-log-group --log-group-name $logGroup 2>$null
            }
        }
    }
}

Write-Host "✓ CloudWatch log groups cleaned up" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DESTRUCTION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$results | Format-Table -AutoSize

Write-Host ""
Write-Host "Total Projects: $($terraformDirs.Count)" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -gt 0) {
    Write-Host "Some resources may still exist. Check AWS Console or run individual terraform destroy commands." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual cleanup commands:" -ForegroundColor Yellow
    foreach ($dir in $terraformDirs) {
        Write-Host "  cd $dir && terraform destroy" -ForegroundColor Gray
    }
    exit 1
} else {
    Write-Host "All resources successfully destroyed! 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: Some resources may take a few minutes to fully delete." -ForegroundColor Gray
    exit 0
}
