# Project Structure

```
Test_LLMs/
│
├── infrastructure/                 # AWS CDK Infrastructure (TypeScript)
│   ├── bin/
│   │   └── infrastructure.ts      # CDK app entry point
│   ├── lib/
│   │   └── multi-llm-rag-stack.ts # Main stack definition
│   ├── package.json               # Node dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   └── cdk.json                  # CDK configuration
│
├── backend/                       # Lambda Functions (Python)
│   ├── chat/
│   │   ├── index.py              # Chat handler (queries 3 LLMs)
│   │   └── requirements.txt      # Python dependencies
│   └── documents/
│       ├── index.py              # Document management handler
│       └── requirements.txt      # Python dependencies
│
├── frontend/                      # React Application
│   ├── public/
│   │   └── index.html            # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.js      # 3-panel chat component
│   │   │   ├── ChatInterface.css
│   │   │   ├── DocumentManager.js    # File upload/management
│   │   │   └── DocumentManager.css
│   │   ├── App.js                # Main app component
│   │   ├── App.css
│   │   ├── index.js              # React entry point
│   │   ├── index.css
│   │   └── config.js             # API configuration
│   └── package.json              # Node dependencies
│
├── .gitignore                    # Git ignore rules
├── PROJECT_DOCUMENTATION.md      # Project overview and architecture
├── README.md                     # Complete documentation
├── DEPLOYMENT_GUIDE.md          # Quick deployment steps
└── PROJECT_STRUCTURE.md         # This file
```

## Key Files Explained

### Infrastructure Layer

**`infrastructure/bin/infrastructure.ts`**
- CDK application entry point
- Defines the stack and AWS account/region

**`infrastructure/lib/multi-llm-rag-stack.ts`**
- Complete infrastructure definition
- Creates: S3 buckets, Lambda functions, API Gateway, Bedrock Knowledge Base, OpenSearch Serverless, CloudFront

### Backend Layer

**`backend/chat/index.py`**
- Main chat handler
- Retrieves context from Knowledge Base
- Queries Claude Sonnet 4, GPT-4o, and Titan in parallel
- Returns all three responses

**`backend/documents/index.py`**
- Handles file uploads to S3
- Lists all uploaded documents
- Deletes documents from S3
- Triggers Knowledge Base sync

### Frontend Layer

**`frontend/src/App.js`**
- Main React component
- Tab navigation (Chat / Document Management)

**`frontend/src/components/ChatInterface.js`**
- Single question input
- Three side-by-side response panels
- Loading states and error handling

**`frontend/src/components/DocumentManager.js`**
- Drag-and-drop file upload
- Document list with delete functionality
- Manual sync trigger

**`frontend/src/config.js`**
- API Gateway URL configuration
- Must be updated after deployment

## Data Flow

### Question Flow
```
User enters question in ChatInterface.js
         ↓
POST /chat → API Gateway
         ↓
Chat Lambda (index.py)
         ↓
Query Bedrock Knowledge Base
         ↓
Parallel requests to:
  - Claude Sonnet 4 (Bedrock)
  - GPT-4o (OpenAI API)
  - Titan (Bedrock)
         ↓
Aggregate responses
         ↓
Return to frontend
         ↓
Display in 3 panels
```

### Upload Flow
```
User uploads file in DocumentManager.js
         ↓
Convert to base64
         ↓
POST /documents → API Gateway
         ↓
Document Lambda (index.py)
         ↓
Upload to S3 bucket
         ↓
Trigger Bedrock Knowledge Base sync
         ↓
Knowledge Base processes document:
  - Chunk text
  - Create embeddings
  - Store in OpenSearch
         ↓
Document ready for queries
```

## Environment Variables

### Chat Lambda
- `KNOWLEDGE_BASE_ID` - Bedrock Knowledge Base ID
- `REGION` - AWS region
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o

### Document Lambda
- `BUCKET_NAME` - S3 bucket for documents
- `KNOWLEDGE_BASE_ID` - Bedrock Knowledge Base ID
- `DATA_SOURCE_ID` - Knowledge Base data source ID
- `REGION` - AWS region

### Frontend
- `REACT_APP_API_URL` - API Gateway URL (set in config.js)

## AWS Resources Created

### Compute
- 2x Lambda Functions (Chat, Documents)

### Storage
- 1x S3 Bucket (Documents)
- 1x S3 Bucket (Frontend hosting)
- 1x OpenSearch Serverless Collection (Vector database)

### AI/ML
- 1x Bedrock Knowledge Base
- 1x Bedrock Data Source

### Networking
- 1x API Gateway REST API
- 1x CloudFront Distribution

### IAM
- 2x IAM Roles (Knowledge Base, Lambda)
- Associated policies for Bedrock, S3, OpenSearch access

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Infrastructure** | AWS CDK (TypeScript) | Infrastructure as Code |
| **Backend** | Python 3.11 | Lambda functions |
| **Frontend** | React 18 | User interface |
| **Vector DB** | OpenSearch Serverless | Store document embeddings |
| **RAG Engine** | AWS Bedrock Knowledge Base | Document retrieval |
| **LLM 1** | Claude Sonnet 4 (Bedrock) | AI responses |
| **LLM 2** | GPT-4o (OpenAI API) | AI responses |
| **LLM 3** | Amazon Titan (Bedrock) | AI responses |
| **Embeddings** | Titan Embeddings v1 | Convert text to vectors |
| **API** | AWS API Gateway | REST endpoints |
| **CDN** | AWS CloudFront | Frontend delivery |
| **Storage** | AWS S3 | Document & static hosting |

## Dependencies

### Infrastructure (Node.js)
```json
{
  "aws-cdk-lib": "^2.120.0",
  "constructs": "^10.3.0",
  "source-map-support": "^0.5.21",
  "typescript": "^5.3.0"
}
```

### Backend (Python)
```
boto3>=1.34.0
openai>=1.10.0
```

### Frontend (Node.js)
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "axios": "^1.6.0",
  "react-scripts": "5.0.1"
}
```

## Build & Deploy Commands

### Infrastructure
```bash
cd infrastructure
npm install
cdk bootstrap    # First time only
cdk synth        # Preview changes
cdk deploy       # Deploy to AWS
cdk destroy      # Clean up resources
```

### Backend
```bash
# No build step needed (deployed by CDK)
# For local testing:
cd backend/chat
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
npm start                    # Local development
npm run build                # Production build
aws s3 sync build/ s3://...  # Deploy
```

## Development Workflow

1. **Make infrastructure changes**: Edit `infrastructure/lib/multi-llm-rag-stack.ts`
2. **Deploy**: `cd infrastructure && cdk deploy`
3. **Make Lambda changes**: Edit `backend/*/index.py`
4. **Redeploy**: `cd infrastructure && cdk deploy`
5. **Make frontend changes**: Edit `frontend/src/**/*.js`
6. **Test locally**: `cd frontend && npm start`
7. **Deploy**: `npm run build && aws s3 sync build/ s3://...`
8. **Invalidate cache**: `aws cloudfront create-invalidation ...`

## Monitoring & Logs

### Lambda Logs
```bash
# Chat Lambda
aws logs tail /aws/lambda/MultiLlmRagStack-ChatLambdaXXXXXXXX --follow

# Document Lambda
aws logs tail /aws/lambda/MultiLlmRagStack-DocumentLambdaXXXXXXXX --follow
```

### API Gateway Logs
- Enable in AWS Console → API Gateway → Stages → Logs/Tracing

### CloudWatch Metrics
- Lambda invocations, duration, errors
- API Gateway requests, latency, 4xx/5xx errors
- S3 bucket requests and data transfer

## Security Considerations

### Current Implementation
- ✅ HTTPS enforced (CloudFront)
- ✅ CORS configured
- ✅ IAM roles with least privilege
- ⚠️ No authentication (public access)
- ⚠️ OpenAI API key in Lambda environment (should use Secrets Manager)

### Production Recommendations
1. Add AWS Cognito for authentication
2. Move API key to AWS Secrets Manager
3. Enable AWS WAF on CloudFront
4. Add rate limiting on API Gateway
5. Enable S3 encryption at rest
6. Enable CloudTrail for audit logs
7. Set up budget alerts

## Common Tasks

### Update OpenAI API Key
1. Edit `infrastructure/lib/multi-llm-rag-stack.ts`
2. Update `OPENAI_API_KEY` in Chat Lambda environment
3. Run `cdk deploy`

### Change Frontend API URL
1. Edit `frontend/src/config.js`
2. Update `API_URL`
3. Rebuild and redeploy frontend

### Add New LLM
1. Edit `backend/chat/index.py`
2. Add new query function
3. Update ThreadPoolExecutor to include new model
4. Redeploy: `cd infrastructure && cdk deploy`
5. Update frontend to display 4th panel

### Modify Document Size Limit
1. Edit `frontend/src/components/DocumentManager.js`
2. Change `file.size > 10 * 1024 * 1024` check
3. Rebuild and redeploy frontend

## Performance Optimization

### Current Configuration
- Chat Lambda: 512 MB RAM, 60s timeout
- Document Lambda: 256 MB RAM, 30s timeout
- Parallel LLM queries (3 concurrent requests)
- CloudFront caching for frontend assets

### Potential Improvements
- Increase Lambda memory for faster processing
- Cache Knowledge Base queries (DynamoDB)
- Stream LLM responses (Server-Sent Events)
- Add Redis for response caching
- Use Lambda Provisioned Concurrency for lower latency

## Estimated Costs

| Service | Cost Structure |
|---------|---------------|
| OpenSearch Serverless | ~$0.50/hour (~$360/month) |
| Lambda | $0.20 per 1M requests + compute time |
| API Gateway | $3.50 per 1M requests |
| Bedrock (Claude) | ~$3 per 1M input tokens |
| Bedrock (Titan) | ~$0.50 per 1M input tokens |
| OpenAI (GPT-4o) | ~$2.50 per 1M input tokens |
| S3 | $0.023 per GB/month |
| CloudFront | $0.085 per GB transfer |

**Note**: OpenSearch Serverless is the most expensive component. Consider using Aurora Serverless v2 with pgvector for a more cost-effective solution in production.
