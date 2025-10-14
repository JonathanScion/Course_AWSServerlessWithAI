# File Upload Demo - AWS Architecture Overview

## Component Locations on AWS

### 1. Frontend Layer (User-Facing)

**CloudFront Distribution** (Global Edge Locations)
- **Purpose**: Content Delivery Network
- **Location**: AWS Edge Locations worldwide
- **Connected To**:
  - S3 Frontend Bucket (origin)
  - WAF Web ACL
- **Features**:
  - HTTPS only
  - Origin Access Control (OAC)
  - Cache invalidation support
  - Custom error pages (404, 403 → index.html)

**S3 Frontend Bucket** (us-east-1)
- **Purpose**: Host React application static files
- **Location**: S3, us-east-1 region
- **Contents**:
  - index.html
  - CSS, JavaScript bundles
  - Static assets
- **Security**:
  - Private bucket
  - Access only via CloudFront OAC
  - Server-side encryption enabled

**WAF Web ACL** (CloudFront - Global)
- **Purpose**: Web Application Firewall
- **Location**: Attached to CloudFront (edge locations)
- **Protection**:
  - Rate limiting: 2000 req/5min per IP
  - AWS Managed Rules (Common Rule Set)
  - AWS Managed Rules (Known Bad Inputs)
- **Logging**: CloudWatch Logs Group `/aws/wafv2/upload-file-demo`

---

### 2. API Layer (us-east-1)

**API Gateway REST API** (Regional)
- **Name**: `upload-file-demo-api`
- **Location**: us-east-1
- **Type**: Regional API Gateway
- **Stages**:
  - `prod`: Production stage
  - `canary`: Canary deployment stage (10% traffic)
- **Authentication**: API Key required
- **Endpoints**:
  - `POST /files/upload` → upload Lambda
  - `POST /files/confirm` → confirm Lambda
  - `GET /files` → list Lambda
  - `GET /files/{fileId}/download` → download Lambda
  - `DELETE /files/{fileId}` → delete Lambda
- **Features**:
  - CORS enabled
  - Request/response logging to CloudWatch
  - Usage plans and throttling
  - X-Ray tracing enabled

**API Key**
- **Location**: API Gateway, us-east-1
- **Purpose**: Authenticate frontend requests
- **Usage Plan**:
  - Quota: 10,000 requests/day
  - Burst limit: 200 requests/second
  - Rate limit: 100 requests/second

---

### 3. Compute Layer (us-east-1)

**Lambda Functions** (All in us-east-1)

1. **upload-file-demo-upload**
   - **Runtime**: Node.js 18
   - **Memory**: 256 MB
   - **Timeout**: 30 seconds
   - **Purpose**: Generate presigned S3 upload URL
   - **Permissions**:
     - S3:PutObject (files bucket)
     - DynamoDB:PutItem (metadata table)
   - **Environment Variables**:
     - BUCKET_NAME
     - TABLE_NAME
     - ALLOWED_ORIGIN

2. **upload-file-demo-confirm**
   - **Runtime**: Node.js 18
   - **Memory**: 256 MB
   - **Purpose**: Verify upload and update status
   - **Permissions**:
     - S3:HeadObject (files bucket)
     - DynamoDB:UpdateItem (metadata table)

3. **upload-file-demo-list**
   - **Runtime**: Node.js 18
   - **Memory**: 256 MB
   - **Purpose**: List all uploaded files
   - **Permissions**:
     - DynamoDB:Scan (metadata table)

4. **upload-file-demo-download**
   - **Runtime**: Node.js 18
   - **Memory**: 256 MB
   - **Purpose**: Generate presigned S3 download URL
   - **Permissions**:
     - S3:GetObject (files bucket)
     - DynamoDB:GetItem (metadata table)

5. **upload-file-demo-delete**
   - **Runtime**: Node.js 18
   - **Memory**: 256 MB
   - **Purpose**: Delete file from S3 and metadata
   - **Permissions**:
     - S3:DeleteObject (files bucket)
     - DynamoDB:DeleteItem (metadata table)

**Lambda Aliases** (for Canary Deployment)
- Each function has a `live` alias
- Points to latest function version
- Supports traffic shifting

**IAM Role**: `upload-file-demo-lambda-role`
- **Attached Policies**:
  - AWSLambdaBasicExecutionRole (AWS managed)
  - Custom policy for S3, DynamoDB, CloudWatch, X-Ray

---

### 4. Storage Layer (us-east-1)

**S3 Files Bucket**
- **Name**: `upload-file-demo-files-<random>`
- **Location**: S3, us-east-1
- **Purpose**: Store uploaded files
- **Features**:
  - Versioning enabled
  - Server-side encryption (AES-256)
  - Public access blocked
  - CORS configured
  - Lifecycle policies:
    - Abort incomplete multipart uploads after 7 days
    - Transition old versions to IA after 30 days
    - Transition old versions to Glacier after 90 days
    - Delete old versions after 365 days
- **Access**: Via presigned URLs only

**DynamoDB Table**
- **Name**: `upload-file-demo-files-metadata`
- **Location**: DynamoDB, us-east-1
- **Billing Mode**: PAY_PER_REQUEST
- **Primary Key**: `fileId` (String)
- **Attributes Stored**:
  - fileId
  - fileName
  - fileSize
  - actualFileSize
  - contentType
  - description
  - uploadTimestamp
  - completedTimestamp
  - status (pending/completed)
- **Features**:
  - Point-in-time recovery enabled
  - Server-side encryption enabled

---

### 5. Observability Layer (us-east-1)

**CloudWatch Logs**
- `/aws/lambda/upload-file-demo-upload`
- `/aws/lambda/upload-file-demo-confirm`
- `/aws/lambda/upload-file-demo-list`
- `/aws/lambda/upload-file-demo-download`
- `/aws/lambda/upload-file-demo-delete`
- `/aws/apigateway/upload-file-demo`
- `/aws/wafv2/upload-file-demo`
- **Retention**: 30 days

**CloudWatch Metrics**
- **Namespace**: FileUploadApp
- **Custom Metrics**:
  - UploadRequestInitiated
  - UploadConfirmed
  - UploadError
  - DownloadRequest
  - DownloadError
  - DeleteRequest
  - DeleteError
  - ListFilesRequest
  - ListFilesError
  - UploadResponseTime
  - DownloadResponseTime
  - FileSize

- **AWS Metrics**:
  - Lambda: Invocations, Errors, Duration, Throttles
  - API Gateway: Count, 4XXError, 5XXError, Latency
  - DynamoDB: ConsumedReadCapacity, ConsumedWriteCapacity

**CloudWatch Dashboard**
- **Name**: `upload-file-demo-dashboard`
- **Widgets**:
  - API Request Metrics (line graph)
  - Error Metrics (line graph)
  - Response Times (line graph)
  - File Size Metrics (line graph)
  - Lambda Invocations (line graph)
  - Lambda Errors (line graph)
  - API Gateway Metrics (line graph)
  - DynamoDB Capacity (line graph)
  - Recent Lambda Errors (log insights)

**CloudWatch Alarms**
- High error rate alarm
- Lambda errors alarm (per function)
- API 5XX errors alarm
- High response time alarm
- Lambda throttles alarm

**X-Ray**
- **Service Map**: Shows request flow through all components
- **Traces**: Captured for every API request
- **Segments**:
  - API Gateway
  - Lambda execution
  - S3 operations
  - DynamoDB operations
- **Enables**: Performance bottleneck identification

---

## Data Flow

### Upload Flow
```
1. User selects file in React app (CloudFront → S3 Frontend)
2. React calls POST /files/upload (CloudFront → API Gateway)
3. API Gateway invokes upload Lambda
4. upload Lambda:
   - Generates presigned S3 URL
   - Creates pending record in DynamoDB
   - Returns presigned URL
5. React uploads file directly to S3 using presigned URL
6. React calls POST /files/confirm
7. confirm Lambda:
   - Verifies file in S3
   - Updates DynamoDB status to "completed"
```

### List Flow
```
1. User views file list (CloudFront → S3 Frontend)
2. React calls GET /files (CloudFront → API Gateway)
3. API Gateway invokes list Lambda
4. list Lambda:
   - Scans DynamoDB for completed files
   - Returns file list
5. React displays files
```

### Download Flow
```
1. User clicks download (CloudFront → S3 Frontend)
2. React calls GET /files/{fileId}/download (CloudFront → API Gateway)
3. API Gateway invokes download Lambda
4. download Lambda:
   - Gets metadata from DynamoDB
   - Generates presigned S3 download URL
   - Returns presigned URL
5. React triggers browser download from presigned URL
```

### Delete Flow
```
1. User clicks delete (CloudFront → S3 Frontend)
2. React calls DELETE /files/{fileId} (CloudFront → API Gateway)
3. API Gateway invokes delete Lambda
4. delete Lambda:
   - Deletes file from S3
   - Deletes metadata from DynamoDB
5. React removes file from display
```

---

## Security Architecture

### Network Security
- **CloudFront**: HTTPS only, WAF protection
- **API Gateway**: API Key authentication, CORS restrictions
- **S3**: Private buckets, presigned URLs for access
- **Lambda**: VPC not required (uses AWS PrivateLink for AWS service access)

### Identity & Access Management
- **Frontend → API**: API Key in headers
- **API Gateway → Lambda**: IAM role
- **Lambda → S3/DynamoDB**: IAM role with least privilege
- **CloudFront → S3**: Origin Access Control (OAC)

### Data Security
- **In Transit**: HTTPS/TLS for all communications
- **At Rest**:
  - S3: AES-256 encryption
  - DynamoDB: AWS managed encryption
- **Presigned URLs**: Time-limited (5 minutes), specific operation only

---

## Scaling & Performance

### Auto-Scaling Components
- **Lambda**: Automatic (0-1000 concurrent executions)
- **API Gateway**: Automatic (10,000 RPS default limit)
- **DynamoDB**: On-demand (auto-scales reads/writes)
- **S3**: Unlimited scalability
- **CloudFront**: Global edge network

### Performance Optimizations
- **CloudFront**: Caching static assets, edge locations
- **Direct S3 Upload**: Presigned URLs bypass Lambda for file transfer
- **DynamoDB Scan**: Filtered to completed files only
- **Lambda Memory**: 256 MB (optimal for these workloads)

---

## Disaster Recovery

### Backup Strategy
- **S3**: Versioning enabled (365-day retention)
- **DynamoDB**: Point-in-time recovery enabled
- **Terraform State**: S3 backend with encryption and versioning

### Recovery Capabilities
- **RTO (Recovery Time Objective)**: ~15 minutes
- **RPO (Recovery Point Objective)**: Near-zero for DynamoDB, version-based for S3

---

## Cost Optimization

### Serverless Cost Model
- **Pay Per Use**: Lambda, DynamoDB, API Gateway
- **Storage Costs**: S3 (pay for GB stored)
- **Data Transfer**: Minimal (presigned URLs use direct S3 transfer)
- **CloudFront**: First 1TB/month free tier

### Cost Controls
- **S3 Lifecycle Policies**: Automatic transition to cheaper storage classes
- **Lambda Timeout**: 30 seconds max
- **DynamoDB**: On-demand billing (no provisioned capacity waste)
- **CloudWatch Log Retention**: 30 days

---

## Compliance & Governance

### Tagging Strategy
All resources tagged with:
- `Project`: upload-file-demo
- `Environment`: prod
- `ManagedBy`: Terraform

### Logging & Auditing
- **CloudTrail**: API calls to AWS services
- **CloudWatch Logs**: Application logs, API Gateway access logs
- **WAF Logs**: Security events
- **S3 Access Logs**: Optional (disabled by default for cost)

---

## Deployment Architecture

### Infrastructure as Code
- **Tool**: Terraform
- **State Backend**: S3 with DynamoDB locking
- **Modules**:
  - API Gateway method module (reusable)
  - Lambda deployment packages

### CI/CD Pipeline (GitHub Actions)
1. **Trigger**: Push to main or manual trigger
2. **Steps**:
   - Terraform init/plan/apply
   - Build React app with env vars
   - Deploy to S3
   - Invalidate CloudFront cache
   - Optional: Configure canary traffic
   - Health check
3. **Canary Deployment**:
   - Traffic shift: 0-100%
   - Monitor metrics
   - Promote or rollback

---

## Monitoring Summary

### What to Monitor
- **Application Health**: Error rates, response times
- **Resource Usage**: Lambda duration, DynamoDB capacity
- **Security**: WAF blocks, API 4XX errors
- **User Experience**: File upload/download success rates
- **Costs**: Lambda invocations, S3 storage growth

### Where to Look
- **Real-time**: CloudWatch Dashboard
- **Troubleshooting**: CloudWatch Logs, X-Ray traces
- **Trends**: CloudWatch Metrics, custom dashboard
- **Alerts**: CloudWatch Alarms → Email/SNS

---

This architecture provides a production-ready, scalable, secure, and fully observable file upload application using AWS serverless services.
