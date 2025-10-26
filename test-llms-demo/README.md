# Multi-LLM RAG Chatbot (Pure AWS Bedrock)

A powerful chatbot application that allows users to ask questions and receive answers from **three different Large Language Models** simultaneously, all powered by the same RAG (Retrieval-Augmented Generation) database.

## Features

- **Multi-LLM Comparison**: Get responses from Claude Sonnet 4, Meta Llama 3 70B, and Amazon Titan side-by-side
- **Pure AWS Bedrock**: All models accessed through a single AWS service - no external API keys needed
- **RAG-Powered**: Answers are grounded in your uploaded documents using Bedrock Knowledge Base
- **Document Management**: Easy upload, list, and delete interface for your knowledge base
- **Real-time Sync**: Automatic knowledge base synchronization when documents are added or removed
- **Modern UI**: Clean, responsive React interface with drag-and-drop file upload

## Architecture

### Components

1. **Frontend** - React application hosted on S3 + CloudFront
2. **API Gateway** - RESTful API for chat and document management
3. **Lambda Functions** - Serverless compute for chat orchestration and document handling
4. **S3** - Document storage
5. **Bedrock Knowledge Base** - AWS-managed RAG engine
6. **OpenSearch Serverless** - Vector database for embeddings
7. **Bedrock LLMs** - Claude Sonnet 4, Meta Llama 3, and Amazon Titan

### Technology Stack

- **Infrastructure**: Terraform (migrated from AWS CDK)
- **Backend**: Python 3.11 (Lambda)
- **Frontend**: React 18
- **CI/CD**: GitHub Actions
- **AI Models** (all via AWS Bedrock):
  - Claude Sonnet 4 (Anthropic)
  - Meta Llama 3 70B (Meta)
  - Amazon Titan Premier (AWS)

## Prerequisites

### AWS Account Setup

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```
3. **Node.js** 18+ and npm
4. **Terraform** >= 1.0
   ```bash
   # macOS
   brew install terraform

   # Windows
   choco install terraform

   # Linux
   wget https://releases.hashicorp.com/terraform/1.0.0/terraform_1.0.0_linux_amd64.zip
   unzip terraform_1.0.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

### AWS Bedrock Access

You need to request access to Bedrock models:

1. Go to AWS Console → Bedrock → Model access
2. Request access to:
   - Claude Sonnet 4 (`anthropic.claude-sonnet-4-20250514`)
   - Meta Llama 3 70B (`meta.llama3-70b-instruct-v1:0`)
   - Amazon Titan Text Premier (`amazon.titan-text-premier-v1:0`)
   - Amazon Titan Embeddings (`amazon.titan-embed-text-v1`)

**Note**: Model access can take a few minutes to be approved.

## Deployment Instructions

### Automatic Deployment (GitHub Actions) - Recommended

The application automatically deploys when changes are pushed to the `main` or `master` branch:

1. **Configure GitHub Secrets**: Ensure your repository has the `AWS_ROLE_ARN` secret configured for OIDC authentication

2. **Push Changes**:
   ```bash
   git add .
   git commit -m "Deploy test-llms-demo"
   git push origin main
   ```

3. **Monitor Deployment**: Check the Actions tab in GitHub to monitor the deployment progress

4. **Access Application**: Once deployed, the workflow summary will show the application URL

The automated workflow:
- Runs Terraform to provision infrastructure
- Packages Python Lambda functions
- Builds React frontend with API endpoint configuration
- Deploys frontend to S3
- Invalidates CloudFront cache

### Manual Deployment

#### Step 1: Deploy Infrastructure

```bash
cd test-llms-demo/terraform

# Initialize Terraform
terraform init

# Review the planned changes
terraform plan

# Apply the changes
terraform apply
```

This will take 10-15 minutes. The deployment will:
- Create S3 buckets for documents and frontend
- Set up OpenSearch Serverless collection
- Create Bedrock Knowledge Base
- Deploy Lambda functions
- Configure API Gateway
- Set up CloudFront distribution

#### Step 2: Get Deployment Outputs

```bash
terraform output
```

Save these values:
```
api_gateway_url = "https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod"
cloudfront_url = "https://xxxxxxxxxx.cloudfront.net"
frontend_bucket_name = "multi-llm-rag-frontend-xxxxxxxx"
cloudfront_distribution_id = "XXXXXXXXXXXXX"
```

#### Step 3: Build and Deploy Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Build with API URL from Terraform outputs
REACT_APP_API_URL=<api_gateway_url> npm run build

# Deploy to S3
aws s3 sync build/ s3://<frontend_bucket_name> --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <cloudfront_distribution_id> \
  --paths "/*"
```

#### Step 4: Access Your Application

Open the CloudFront URL from the Terraform outputs:
```
https://xxxxxxxxxx.cloudfront.net
```

## Usage

### 1. Upload Documents

1. Navigate to the **Document Management** tab
2. Drag and drop files or click to upload
3. Supported formats: PDF, TXT, DOC, DOCX, MD
4. Maximum file size: 10MB
5. Wait for the knowledge base sync to complete (~1-2 minutes)

### 2. Ask Questions

1. Navigate to the **Chat** tab
2. Type your question in the input field
3. Click **Ask** or press Enter
4. View responses from all three models side-by-side

### 3. Compare Responses

- **Purple panel**: Claude Sonnet 4 (Anthropic) - Most capable, best reasoning
- **Green panel**: Meta Llama 3 70B (Meta) - Top open-source model
- **Orange panel**: Amazon Titan Premier (AWS) - AWS native model

## Cost Estimation

### Per 1000 Queries (assuming ~2K tokens per response):

- **Claude Sonnet 4**: ~$6
- **Meta Llama 3 70B**: ~$2
- **Amazon Titan**: ~$1.50
- **Knowledge Base (embeddings + search)**: ~$1
- **OpenSearch Serverless**: ~$0.50/hour (~$360/month)
- **Lambda**: ~$0.50
- **API Gateway**: ~$0.10
- **S3 + CloudFront**: Negligible

**Total**: ~$11 per 1000 queries + ~$360/month for OpenSearch Serverless

**Note**: OpenSearch Serverless has a fixed monthly cost even with no usage. For development, consider pausing the collection when not in use.

## Troubleshooting

### Error: "Model access denied"

**Solution**: Go to AWS Console → Bedrock → Model access and request access to Claude, Llama 3, and Titan models.

### Knowledge Base sync is slow

**Normal behavior**: Initial sync can take 5-10 minutes depending on document size. Subsequent syncs are faster.

### Frontend shows API errors

**Solution**: Ensure the frontend is built with the correct API Gateway URL:
```bash
REACT_APP_API_URL=<your_api_url> npm run build
```

### CORS errors in browser console

**Solution**:
1. Verify the API Gateway has CORS enabled (it's configured automatically in Terraform)
2. Check that you're accessing the frontend via CloudFront, not directly from S3
3. Ensure all OPTIONS methods are properly configured

### Lambda timeout errors

**Solution**: Large documents or complex questions may timeout. Current timeout is 60 seconds. You can increase it in `terraform/variables.tf`:

```hcl
variable "lambda_timeout" {
  default = 90  # Increase from 60 to 90 seconds
}
```

Then run `terraform apply` to update.

## Development

### Local Frontend Development

```bash
cd frontend
npm install
REACT_APP_API_URL=<your_api_url> npm start
```

The app will run on http://localhost:3000

### Updating Lambda Functions

After modifying Lambda code in `backend/chat` or `backend/documents`:

```bash
cd terraform
terraform apply
```

Terraform will detect changes and update the Lambda functions.

### Updating Infrastructure

Modify Terraform files in the `terraform/` directory, then:

```bash
cd terraform
terraform plan  # Review changes
terraform apply # Apply changes
```

### Viewing Logs

```bash
# Chat Lambda logs
aws logs tail /aws/lambda/multi-llm-rag-chat --follow

# Document Lambda logs
aws logs tail /aws/lambda/multi-llm-rag-documents --follow
```

## Cleanup

To avoid ongoing charges, delete all resources:

```bash
cd test-llms-demo/terraform
terraform destroy
```

This will remove all Lambda functions, API Gateway, S3 buckets, CloudFront distribution, OpenSearch Serverless collection, and Bedrock Knowledge Base.

**Note**: Some resources like CloudFront distributions can take up to 30 minutes to fully delete. The S3 buckets will be emptied and deleted automatically.

## Security Considerations

### Production Recommendations:

1. **API Authentication**: Add AWS Cognito or API keys to the API Gateway
2. **S3 Bucket Policies**: Restrict access and enable encryption
3. **CloudFront**: Add AWS WAF for DDoS protection
4. **Input Validation**: Add rate limiting and input sanitization
5. **HTTPS**: Ensure all traffic uses HTTPS (CloudFront handles this)

## Why Pure Bedrock?

This implementation uses **only AWS Bedrock models**, which means:

✅ **Single AWS Account** - Everything in one place
✅ **One Bill** - Unified AWS billing
✅ **No External API Keys** - Just AWS IAM credentials
✅ **Simpler Architecture** - No hybrid API integration
✅ **Better Security** - All traffic stays within AWS
✅ **Easier Compliance** - Single cloud provider

You get excellent model diversity:
- **Claude Sonnet 4** - Industry-leading reasoning and accuracy
- **Meta Llama 3** - Best open-source model, great value
- **Amazon Titan** - AWS native, optimized for AWS infrastructure

## Migration from AWS CDK to Terraform

This project was migrated from AWS CDK (TypeScript) to Terraform to maintain consistency with other projects in the repository and leverage GitHub Actions for automated deployments.

### What Changed

- **Infrastructure as Code**: Converted from CDK TypeScript to Terraform HCL
- **Deployment Method**: Manual `cdk deploy` → Automated GitHub Actions + Terraform
- **State Management**: CDK-managed state → Terraform S3 backend
- **Configuration**: CDK `cdk.json` → Terraform `.tf` files

### What Stayed the Same

- All AWS resources and architecture remain identical
- Lambda function code (Python) unchanged
- Frontend React application unchanged
- API endpoints and behavior unchanged
- Functionality completely preserved

### Migration Benefits

1. **Consistency**: All sub-projects now use Terraform + GitHub Actions
2. **Automation**: Deployments trigger automatically on push to main
3. **Visibility**: Deployment status visible in GitHub Actions UI
4. **State Management**: Centralized state in S3 with locking
5. **Portability**: Standard Terraform format easier for team collaboration

### Removed Files

The following CDK-specific files were removed:
- `infrastructure/` directory (CDK TypeScript code)
- `cdk.json`, `tsconfig.json` (CDK configuration)
- `cdk.out/` (generated CloudFormation templates)

## Future Enhancements

- [ ] Add more Bedrock models (Mistral, Cohere, Claude Opus)
- [ ] Implement conversation history
- [ ] Add user feedback mechanism (thumbs up/down)
- [ ] Track response times and costs per model
- [ ] Multi-turn conversations
- [ ] Document preprocessing and chunking options
- [ ] Custom prompt templates
- [ ] Export conversation transcripts

## License

This project is provided as-is for educational and demonstration purposes.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review CloudWatch logs for detailed error messages
3. Verify all AWS Bedrock model access is approved

## Acknowledgments

- Built with Terraform, React, and Python
- Infrastructure deployed via GitHub Actions
- Uses AWS Bedrock for all LLM access (Claude, Llama, Titan)
- Powered by OpenSearch Serverless for vector search
