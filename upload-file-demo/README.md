# File Upload Demo - Serverless Application

A full-stack serverless file upload application built with React, AWS Lambda, S3, DynamoDB, API Gateway, CloudFront, and WAF. Features drag-and-drop file upload, file management, full observability, and canary deployment methodology.

## Features

- **Drag & Drop File Upload**: Intuitive file upload interface with progress tracking
- **File Management**: List, download, and delete uploaded files
- **File Metadata**: Store and display file descriptions, sizes, timestamps
- **Secure Storage**: Files stored in S3 with encryption at rest
- **Full Observability**: CloudWatch metrics, logs, dashboards, and X-Ray tracing
- **Security**: WAF protection, API key authentication, presigned URLs
- **Canary Deployments**: Gradual rollout with traffic shifting
- **Scalable Architecture**: Serverless infrastructure that scales automatically

## Architecture

### AWS Components

```
┌─────────────┐
│   CloudFront│ ◄── CDN with WAF Protection
│ Distribution│
└──────┬──────┘
       │
       ├─────► S3 (Frontend) ◄── React Application
       │
       └─────► API Gateway ◄── REST API with API Key
                    │
                    ├─────► Lambda (upload.js) ◄── Generate presigned upload URL
                    │
                    ├─────► Lambda (confirm.js) ◄── Confirm upload completion
                    │
                    ├─────► Lambda (list.js) ◄── List all files
                    │
                    ├─────► Lambda (download.js) ◄── Generate presigned download URL
                    │
                    └─────► Lambda (delete.js) ◄── Delete file
                              │
                              ├─────► S3 (Files) ◄── Uploaded files storage
                              │
                              └─────► DynamoDB ◄── File metadata storage

┌─────────────────────────────────────────────────────────────┐
│                    Observability Layer                       │
├─────────────────────────────────────────────────────────────┤
│ CloudWatch Logs | CloudWatch Metrics | X-Ray Tracing |      │
│ CloudWatch Dashboard | CloudWatch Alarms                     │
└─────────────────────────────────────────────────────────────┘
```

### Infrastructure Details

#### Frontend (React Application)
- **Location**: CloudFront → S3 Bucket
- **Features**:
  - Drag-and-drop file upload
  - Real-time upload progress
  - File listing with metadata
  - Download and delete operations
- **CDN**: CloudFront distribution for global delivery
- **Security**: WAF Web ACL with rate limiting and managed rules

#### Backend (Serverless API)
- **API Gateway**: RESTful API with API key authentication
- **Lambda Functions** (Node.js 18):
  1. **upload**: Generates presigned S3 upload URL
  2. **confirm**: Confirms successful upload and updates metadata
  3. **list**: Retrieves all uploaded files from DynamoDB
  4. **download**: Generates presigned S3 download URL
  5. **delete**: Deletes file from S3 and metadata from DynamoDB

#### Storage
- **S3 Buckets**:
  - Frontend bucket: Hosts React application
  - Files bucket: Stores uploaded files
  - Features: Versioning, encryption, lifecycle policies
- **DynamoDB Table**: `upload-file-demo-files-metadata`
  - Partition Key: `fileId`
  - Stores: fileName, fileSize, contentType, description, timestamps, status

#### Security
- **WAF**: Rate limiting, AWS managed rule sets (Common, Known Bad Inputs)
- **API Key**: Required for all API Gateway requests
- **Presigned URLs**: Temporary, time-limited access to S3 objects
- **IAM Roles**: Least privilege access for Lambda functions
- **S3 Bucket Policies**: Restricted access via CloudFront OAC

#### Observability
- **CloudWatch Logs**: All Lambda function logs with retention
- **CloudWatch Metrics**: Custom application metrics
- **CloudWatch Dashboard**: Real-time visualization of key metrics
- **CloudWatch Alarms**: Automated alerting for errors, high response times
- **X-Ray Tracing**: Distributed tracing for all API calls

## Project Structure

```
upload-file-demo/
├── client/                          # React frontend
│   ├── public/
│   │   └── index.html              # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.js       # Drag-drop upload component
│   │   │   ├── FileUpload.css
│   │   │   ├── FileList.js         # File listing component
│   │   │   └── FileList.css
│   │   ├── services/
│   │   │   └── api.js              # API client
│   │   ├── App.js                  # Main application
│   │   ├── App.css
│   │   ├── index.js                # Entry point
│   │   └── index.css
│   └── package.json
│
└── terraform/                       # Infrastructure as Code
    ├── main.tf                     # Terraform configuration
    ├── variables.tf                # Input variables
    ├── outputs.tf                  # Output values
    ├── dynamodb.tf                 # DynamoDB table
    ├── s3.tf                       # S3 buckets
    ├── lambda.tf                   # Lambda functions
    ├── api_gateway.tf              # API Gateway
    ├── cloudfront.tf               # CloudFront distribution
    ├── waf.tf                      # WAF Web ACL
    ├── monitoring.tf               # CloudWatch resources
    ├── modules/
    │   └── api_method/
    │       └── main.tf             # API Gateway method module
    └── lambda/                     # Lambda function code
        ├── upload.js               # Upload handler
        ├── confirm.js              # Confirm handler
        ├── list.js                 # List handler
        ├── download.js             # Download handler
        ├── delete.js               # Delete handler
        └── package.json            # Lambda dependencies
```

## Deployment

### Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured
3. Terraform installed (v1.0+)
4. Node.js 18+
5. GitHub repository with OIDC configured for AWS

### Initial Deployment

1. **Deploy Infrastructure**:
```bash
cd upload-file-demo/terraform
terraform init
terraform plan
terraform apply
```

2. **Get Outputs**:
```bash
terraform output api_gateway_url
terraform output api_key
terraform output website_url
```

3. **Build Frontend**:
```bash
cd ../client
npm install
REACT_APP_API_URL=<api_gateway_url> REACT_APP_API_KEY=<api_key> npm run build
```

4. **Deploy Frontend to S3**:
```bash
aws s3 sync build/ s3://<frontend_bucket_name> --delete
aws cloudfront create-invalidation --distribution-id <cloudfront_id> --paths "/*"
```

### CI/CD Deployment

The application uses GitHub Actions for automated deployment with canary release support.

**Workflow File**: `.github/workflows/deploy-upload-demo.yml`

**Automatic Deployment**:
- Triggers on push to `main` branch when files in `upload-file-demo/` change

**Manual Deployment with Canary**:
```bash
# Deploy with 10% canary traffic
gh workflow run deploy-upload-demo.yml \
  -f canary_percentage=10

# Promote canary to production
gh workflow run deploy-upload-demo.yml \
  -f promote_canary=yes
```

### Canary Deployment Process

1. **Deploy New Version**: Infrastructure and code are deployed
2. **Set Canary Traffic**: Route percentage of traffic to new version
3. **Monitor Metrics**: Check CloudWatch dashboard for errors/performance
4. **Promote or Rollback**:
   - **Promote**: Set canary to 100% traffic
   - **Rollback**: Set canary to 0% or redeploy previous version

## API Endpoints

Base URL: `<API_GATEWAY_URL>/prod`

All requests require `X-Api-Key` header.

### POST /files/upload
Request presigned URL for file upload.

**Request Body**:
```json
{
  "fileName": "example.pdf",
  "fileSize": 1024000,
  "contentType": "application/pdf",
  "description": "Optional file description"
}
```

**Response**:
```json
{
  "presignedUrl": "https://s3.amazonaws.com/...",
  "fileId": "1234567890-example.pdf",
  "expiresIn": 300
}
```

### POST /files/confirm
Confirm file upload completion.

**Request Body**:
```json
{
  "fileId": "1234567890-example.pdf"
}
```

### GET /files
List all uploaded files.

**Response**:
```json
{
  "files": [
    {
      "fileId": "1234567890-example.pdf",
      "fileName": "example.pdf",
      "fileSize": 1024000,
      "contentType": "application/pdf",
      "description": "My file",
      "uploadTimestamp": "2025-01-01T12:00:00Z",
      "status": "completed"
    }
  ]
}
```

### GET /files/{fileId}/download
Get presigned URL for file download.

**Response**:
```json
{
  "presignedUrl": "https://s3.amazonaws.com/...",
  "fileName": "example.pdf",
  "expiresIn": 300
}
```

### DELETE /files/{fileId}
Delete a file.

**Response**:
```json
{
  "message": "File deleted successfully",
  "fileId": "1234567890-example.pdf"
}
```

## Monitoring & Observability

### CloudWatch Dashboard

Access: AWS Console → CloudWatch → Dashboards → `upload-file-demo-dashboard`

**Metrics Tracked**:
- API Request counts (upload, download, list, delete)
- Error rates by operation
- Response times (average)
- File sizes (average, maximum)
- Lambda invocations and errors
- API Gateway metrics (4XX, 5XX errors)
- DynamoDB capacity consumption

### CloudWatch Alarms

- High error rate (>10 errors in 5 minutes)
- Lambda errors (>5 errors in 5 minutes)
- API Gateway 5XX errors (>10 in 5 minutes)
- High response time (>2000ms average)
- Lambda throttling (>5 throttles in 5 minutes)

### X-Ray Tracing

All API calls are traced end-to-end:
1. API Gateway receives request
2. Lambda function processes request
3. S3/DynamoDB operations
4. Response returned

Access: AWS Console → X-Ray → Service Map

### Logs

All Lambda function logs are available in CloudWatch Logs:
- Log Group: `/aws/lambda/upload-file-demo-<function-name>`
- Retention: 30 days
- Format: JSON with custom metrics

## Configuration

### Environment Variables (Frontend)
```env
REACT_APP_API_URL=<API Gateway URL>
REACT_APP_API_KEY=<API Key from Terraform output>
```

### Terraform Variables
```hcl
variable "aws_region" {
  default = "us-east-1"
}

variable "project_name" {
  default = "upload-file-demo"
}

variable "max_file_size_mb" {
  default = 100
}

variable "enable_waf" {
  default = true
}
```

## Cost Estimation

**Monthly costs for moderate usage** (assumes 10,000 uploads, 50,000 downloads):

- Lambda: ~$5
- S3 Storage (100GB): ~$2.30
- S3 Requests: ~$1
- DynamoDB: ~$2 (PAY_PER_REQUEST)
- API Gateway: ~$3.50
- CloudFront: ~$1 (first 1TB free tier)
- WAF: ~$5
- CloudWatch: ~$3

**Total**: ~$22.80/month

## Security Best Practices

1. **API Key Rotation**: Regularly rotate API keys
2. **S3 Bucket Policies**: Never make buckets public
3. **Presigned URL Expiration**: Keep URLs short-lived (5 minutes)
4. **File Validation**: Implement client and server-side file type validation
5. **Rate Limiting**: WAF enforces 2000 requests/5 minutes per IP
6. **Encryption**: Enable encryption at rest for S3 and DynamoDB
7. **IAM Roles**: Use least privilege access

## Troubleshooting

### Upload Fails
- Check CloudWatch logs for Lambda errors
- Verify presigned URL hasn't expired
- Check file size is under 100MB limit
- Verify S3 bucket permissions

### Files Not Listing
- Check DynamoDB table for entries
- Verify status is "completed"
- Check Lambda list function logs
- Verify API key is correct

### Download Fails
- Check file exists in S3
- Verify presigned URL generation in logs
- Check S3 bucket CORS configuration

### High Error Rates
- Check CloudWatch alarms
- Review Lambda function logs
- Check API Gateway metrics
- Review X-Ray traces for bottlenecks

## License

This project is part of the AWS Serverless Course and is provided as-is for educational purposes.

## Support

For issues or questions, please check:
1. CloudWatch Logs
2. CloudWatch Dashboard
3. X-Ray Service Map
4. GitHub Issues

---

**Last Updated**: 2025-10-15 - OIDC authentication and Terraform backend configured for GitHub Actions deployment
