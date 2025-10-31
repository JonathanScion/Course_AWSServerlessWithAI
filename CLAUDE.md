# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an AWS Serverless course repository containing three independent full-stack serverless applications demonstrating different AWS architectures and patterns. Each sub-project uses Terraform for infrastructure as code and GitHub Actions for CI/CD.

## Project Structure

```
Course_AWSServerlessWithAI/
├── aws-oidc-setup/          # OIDC configuration for GitHub Actions → AWS
├── react-node-demo/         # React + Node.js Lambda + DynamoDB demo
├── test-llms-demo/          # Multi-LLM RAG chatbot with Bedrock
└── upload-file-demo/        # File upload with S3, DynamoDB, observability
```

## Sub-Projects Architecture

### 1. react-node-demo
**Stack:** React + Node.js Lambda + DynamoDB + API Gateway + CloudFront
- Frontend: React app in `client/`
- Backend: Express-like Lambda functions in `server/`
- Infrastructure: Terraform in `terraform/`
- Deployment: GitHub Actions workflow `.github/workflows/deploy-production.yml`

### 2. test-llms-demo
**Stack:** React + Python Lambda + Bedrock + OpenSearch Serverless + Knowledge Base
- Frontend: React app in `frontend/`
- Backend: Python Lambda functions in `backend/chat/` and `backend/documents/`
- Key Features: Multi-LLM comparison (Claude, Llama, Titan), RAG with Bedrock Knowledge Base
- Infrastructure: Terraform in `terraform/` with specialized files:
  - `bedrock.tf` - Bedrock Knowledge Base configuration
  - `opensearch.tf` - OpenSearch Serverless collection
  - `opensearch_index.tf` - Index creation via Python script
- Deployment: GitHub Actions workflow `.github/workflows/deploy-test-llms-demo.yml`

### 3. upload-file-demo
**Stack:** React + Node.js Lambda + S3 + DynamoDB + CloudWatch + X-Ray + WAF
- Frontend: React app in `client/`
- Backend: Multiple Lambda functions in `terraform/lambda/` (upload.js, confirm.js, list.js, download.js, delete.js)
- Key Features: Full observability stack, canary deployments, WAF protection
- Infrastructure: Terraform in `terraform/` with `monitoring.tf` for CloudWatch dashboards/alarms
- Deployment: GitHub Actions workflow `.github/workflows/deploy-upload-demo.yml`

## Common Development Commands

### Terraform Operations
```bash
# Navigate to specific project's terraform directory first
cd <project-name>/terraform

# Initialize Terraform (first time or after changes to providers)
terraform init

# Preview changes
terraform plan

# Apply infrastructure changes
terraform apply

# View outputs (API URLs, bucket names, etc.)
terraform output

# Destroy all resources
terraform destroy
```

### Frontend Development

#### react-node-demo & upload-file-demo
```bash
cd <project-name>/client
npm install
npm start  # Development server on localhost:3000

# Build for production (requires API URL and API key from terraform output)
REACT_APP_API_URL=<api_url> REACT_APP_API_KEY=<api_key> npm run build

# Deploy to S3
aws s3 sync build/ s3://<bucket-name> --delete
```

#### test-llms-demo
```bash
cd test-llms-demo/frontend
npm install
npm start  # Development server on localhost:3000

# Build for production (requires API URL from terraform output)
REACT_APP_API_URL=<api_url> npm run build

# Deploy to S3 and invalidate CloudFront
aws s3 sync build/ s3://<bucket-name> --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

### Backend Testing

#### Python Lambdas (test-llms-demo)
```bash
cd test-llms-demo/backend

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install boto3

# Test locally (requires AWS credentials and env vars)
python -c "from chat.index import lambda_handler; lambda_handler({'body': '{\"question\":\"test\"}'}, {})"
```

#### Node.js Lambdas (react-node-demo, upload-file-demo)
Lambdas are tested by deploying via Terraform and viewing CloudWatch logs.

### Viewing Logs

#### CloudWatch Logs (All projects)
```bash
# Using AWS CLI
aws logs tail /aws/lambda/<function-name> --follow --region us-east-1

# test-llms-demo helper scripts
bash test-llms-demo/view-logs.sh multi-llm-rag-chat 60

# PowerShell scripts (test-llms-demo)
.\test-llms-demo\view-cloudwatch-logs.ps1
```

#### Log Management (test-llms-demo)
```bash
# Check old log groups
.\test-llms-demo\check-old-logs.ps1

# Clean up old logs
.\test-llms-demo\cleanup-old-logs.ps1
```

## CI/CD and Deployment

All projects use **GitHub Actions with OIDC authentication** to AWS. No static credentials are stored.

### Setup OIDC (First Time)
```bash
cd aws-oidc-setup

# Option A: Terraform (recommended)
terraform init
terraform apply -var="github_org=YourGitHubUsername"

# Option B: Manual
# Edit trust-policy.json with your AWS account ID and GitHub username
chmod +x setup-commands.sh
./setup-commands.sh

# Add resulting Role ARN to GitHub Secrets as AWS_ROLE_ARN
```

### Automated Deployments
Deployments trigger automatically on push to `main`/`master` when files in the project directory change:
- `react-node-demo/**` → `.github/workflows/deploy-production.yml`
- `test-llms-demo/**` → `.github/workflows/deploy-test-llms-demo.yml`
- `upload-file-demo/**` → `.github/workflows/deploy-upload-demo.yml`

### Manual Deployment Trigger
```bash
# Using GitHub CLI
gh workflow run deploy-test-llms-demo.yml

# upload-file-demo supports canary deployments
gh workflow run deploy-upload-demo.yml -f canary_percentage=10
gh workflow run deploy-upload-demo.yml -f promote_canary=yes
```

## Key Architectural Patterns

### test-llms-demo: Bedrock Knowledge Base Flow
1. User uploads documents → S3 bucket
2. Documents Lambda triggers Knowledge Base sync
3. OpenSearch Serverless stores vector embeddings
4. Chat Lambda queries Knowledge Base for context
5. Parallel invocation of 3 LLMs (Claude, Llama, Titan) via Bedrock
6. Responses aggregated and returned to frontend

**Critical:** OpenSearch index must exist before Knowledge Base creation. This is handled by `opensearch_index.tf` which runs a Python script to create the index.

### upload-file-demo: Presigned URL Pattern
1. Client requests upload URL from `/files/upload` Lambda
2. Lambda generates presigned S3 URL, stores "pending" metadata in DynamoDB
3. Client uploads directly to S3 using presigned URL
4. Client calls `/files/confirm` to mark upload complete
5. Metadata updated to "completed" status in DynamoDB

### react-node-demo: API Gateway + Lambda Integration
- API Gateway proxies all requests to Lambda
- Lambda uses Express-like routing
- DynamoDB for data persistence
- CloudFront for CDN and S3 website hosting

## Debugging Workflow

### 1. Start with CloudWatch Logs (Fastest)
```bash
aws logs tail /aws/lambda/<function-name> --follow
```
- See actual AWS environment errors
- Check IAM permission issues
- View Bedrock/Knowledge Base errors

### 2. Check Terraform State
```bash
cd <project>/terraform
terraform show
terraform output
```

### 3. Test API Endpoints
```bash
# Get API URL
terraform output api_gateway_url

# Test endpoint
curl -X POST <api-url>/endpoint \
  -H "X-Api-Key: <key>" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 4. CloudWatch Dashboards (upload-file-demo)
- AWS Console → CloudWatch → Dashboards → `upload-file-demo-dashboard`
- Shows metrics, error rates, response times, Lambda invocations

### 5. X-Ray Tracing (upload-file-demo)
- AWS Console → X-Ray → Service Map
- Trace requests through API Gateway → Lambda → S3/DynamoDB

## Important Notes

### AWS Bedrock Model Access (test-llms-demo)
Before deploying test-llms-demo:
1. Go to AWS Console → Bedrock → Model access
2. Request access to:
   - Claude Sonnet 4 (`anthropic.claude-sonnet-4-20250514`)
   - Meta Llama 3 70B (`meta.llama3-70b-instruct-v1:0`)
   - Amazon Titan Text Premier (`amazon.titan-text-premier-v1:0`)
   - Amazon Titan Embeddings (`amazon.titan-embed-text-v1`)

### OpenSearch Serverless Costs (test-llms-demo)
- Fixed monthly cost (~$360/month) even with no usage
- Consider pausing collection during development
- Index creation must happen before Knowledge Base setup

### Terraform State
All projects use local Terraform state. When working with multiple developers, consider migrating to S3 backend with state locking.

### Environment Variables in Frontend Builds
Frontend apps require API URLs to be set at build time:
```bash
# React apps read from REACT_APP_* environment variables
REACT_APP_API_URL=<url> REACT_APP_API_KEY=<key> npm run build
```

### CORS Configuration
All API Gateways have CORS enabled. Access frontends via CloudFront URLs, not S3 directly.

## Troubleshooting Common Issues

### "Model access denied" (test-llms-demo)
→ Request model access in AWS Bedrock console

### Frontend shows API errors
→ Verify frontend was built with correct API URL: `terraform output api_gateway_url`

### Lambda timeout (test-llms-demo)
→ Increase timeout in `terraform/variables.tf`, then `terraform apply`

### OpenSearch index not found (test-llms-demo)
→ Check `opensearch_index.tf` execution logs, may need manual index creation

### Upload fails (upload-file-demo)
→ Check presigned URL expiration (5 minutes default), verify S3 bucket permissions

### GitHub Actions deployment fails
→ Verify AWS_ROLE_ARN secret exists, check OIDC trust policy in IAM

## Cost Management

### Development Cost-Saving Tips
- Destroy resources when not in use: `terraform destroy`
- OpenSearch Serverless (test-llms-demo) is most expensive (~$360/month)
- Lambda, API Gateway, S3 stay within free tier for low usage
- CloudWatch logs: Set retention periods to minimize storage costs

### Production Considerations
- Enable CloudFront WAF (upload-file-demo has this)
- Add API authentication beyond API keys (consider Cognito)
- Enable S3 bucket versioning and lifecycle policies
- Set up CloudWatch alarms for cost anomalies
