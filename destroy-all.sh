#!/bin/bash
# Bash Script to Destroy ALL AWS Infrastructure
# Run this from the repository root

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo -e "  AWS Infrastructure Destruction Script"
echo -e "========================================${NC}"
echo ""

# List of all terraform directories
TERRAFORM_DIRS=(
    "test-llms-demo/terraform"
    "upload-file-demo/terraform"
    "react-node-demo/terraform"
    "aws-oidc-setup"
)

# Warning prompt
echo -e "${RED}WARNING: This will destroy ALL AWS resources created by this repository:${NC}"
echo ""
echo -e "${YELLOW}  1. test-llms-demo (Bedrock, OpenSearch Serverless, Lambda, API Gateway)"
echo -e "  2. upload-file-demo (S3, Lambda, DynamoDB, CloudWatch)"
echo -e "  3. react-node-demo (Lambda, DynamoDB, API Gateway, CloudFront)"
echo -e "  4. aws-oidc-setup (IAM Role for GitHub Actions)${NC}"
echo ""
echo -e "${RED}This action CANNOT be undone!${NC}"
echo ""

read -p "Type 'DESTROY' to confirm (case-sensitive): " confirmation

if [ "$confirmation" != "DESTROY" ]; then
    echo -e "${GREEN}Aborted. No resources were destroyed.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting destruction process...${NC}"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0

for dir in "${TERRAFORM_DIRS[@]}"; do
    PROJECT_NAME=$(basename $(dirname "$dir"))
    if [ "$dir" == "aws-oidc-setup" ]; then
        PROJECT_NAME="aws-oidc-setup"
    fi

    echo -e "${CYAN}========================================"
    echo -e "Destroying: $PROJECT_NAME"
    echo -e "${GRAY}Directory: $dir${NC}"
    echo -e "${CYAN}========================================${NC}"

    if [ ! -d "$dir" ]; then
        echo -e "${RED}Directory not found: $dir${NC}"
        ((FAIL_COUNT++))
        continue
    fi

    # Change to terraform directory
    cd "$dir"

    # Check if terraform state exists
    if [ ! -d ".terraform" ]; then
        echo -e "${YELLOW}No Terraform state found. Running terraform init...${NC}"
        terraform init
    fi

    # Run terraform destroy with auto-approve
    echo -e "${YELLOW}Running terraform destroy...${NC}"
    if terraform destroy -auto-approve; then
        echo -e "${GREEN}✓ Successfully destroyed $PROJECT_NAME${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}✗ Failed to destroy $PROJECT_NAME${NC}"
        ((FAIL_COUNT++))
    fi

    # Return to root
    cd - > /dev/null
    echo ""
done

# Clean up CloudWatch Log Groups (optional but recommended)
echo -e "${CYAN}========================================"
echo -e "Cleaning up CloudWatch Log Groups"
echo -e "========================================${NC}"

LOG_GROUP_PREFIXES=(
    "/aws/lambda/multi-llm-rag-"
    "/aws/lambda/upload-file-demo-"
    "/aws/lambda/react-node-demo-"
)

echo -e "${YELLOW}Searching for old log groups...${NC}"

for prefix in "${LOG_GROUP_PREFIXES[@]}"; do
    LOG_GROUPS=$(aws logs describe-log-groups \
        --log-group-name-prefix "$prefix" \
        --query 'logGroups[].logGroupName' \
        --output text 2>/dev/null || echo "")

    if [ -n "$LOG_GROUPS" ]; then
        for log_group in $LOG_GROUPS; do
            echo -e "${GRAY}Deleting log group: $log_group${NC}"
            aws logs delete-log-group --log-group-name "$log_group" 2>/dev/null || true
        done
    fi
done

echo -e "${GREEN}✓ CloudWatch log groups cleaned up${NC}"
echo ""

# Summary
echo -e "${CYAN}========================================"
echo -e "  DESTRUCTION SUMMARY"
echo -e "========================================${NC}"
echo ""
echo -e "Total Projects: ${#TERRAFORM_DIRS[@]}"
echo -e "${GREEN}Successful: $SUCCESS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
    echo -e "${YELLOW}Some resources may still exist. Check AWS Console or run individual terraform destroy commands.${NC}"
    echo ""
    echo -e "${YELLOW}Manual cleanup commands:${NC}"
    for dir in "${TERRAFORM_DIRS[@]}"; do
        echo -e "${GRAY}  cd $dir && terraform destroy${NC}"
    done
    exit 1
else
    echo -e "${GREEN}All resources successfully destroyed! 🎉${NC}"
    echo ""
    echo -e "${GRAY}Note: Some resources may take a few minutes to fully delete.${NC}"
    exit 0
fi
