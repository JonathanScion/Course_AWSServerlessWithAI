# Quick Deployment Guide (Pure AWS Bedrock)

## Prerequisites Checklist

- [ ] AWS Account with admin access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] AWS CDK installed (`npm install -g aws-cdk`)
- [ ] AWS Bedrock model access approved (Claude, Llama 3, Titan)

## Step-by-Step Deployment

### 1. Request Bedrock Model Access (Do This First!)

This can take a few minutes, so start here:

1. Go to [AWS Console → Bedrock → Model access](https://console.aws.amazon.com/bedrock/)
2. Click **"Manage model access"**
3. Select these models:
   - ☑️ Claude Sonnet 4 (`anthropic.claude-sonnet-4-20250514`)
   - ☑️ Meta Llama 3 70B (`meta.llama3-70b-instruct-v1:0`)
   - ☑️ Amazon Titan Text Premier (`amazon.titan-text-premier-v1:0`)
   - ☑️ Amazon Titan Embeddings (`amazon.titan-embed-text-v1`)
4. Click **"Request model access"**
5. Wait for approval (usually instant, but can take up to 10 minutes)

### 2. Install Dependencies

```bash
cd Test_LLMs

# Infrastructure
cd infrastructure
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Deploy Infrastructure

```bash
cd infrastructure

# Bootstrap CDK (first time only, skip if already done)
cdk bootstrap

# Deploy
cdk deploy

# When prompted "Do you wish to deploy these changes (y/n)?", type: y
```

⏱️ **This takes 10-15 minutes**. Go grab a coffee!

### 4. Save the Outputs

When deployment completes, you'll see outputs like:

```
Outputs:
MultiLlmRagStack.ApiUrl = https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/
MultiLlmRagStack.CloudFrontUrl = https://d1234567890abc.cloudfront.net
MultiLlmRagStack.FrontendBucketName = multiLlmragstack-frontendbucketabcd1234-xyz
```

**Copy these values!** You need them for the next steps.

### 5. Configure Frontend

Edit `frontend/src/config.js`:

```javascript
export const API_URL = 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod';
//                       👆 Paste your ApiUrl here (remove trailing slash)
```

### 6. Build and Deploy Frontend

```bash
cd frontend

# Build
npm run build

# Deploy to S3 (replace YOUR_FRONTEND_BUCKET_NAME with the bucket from step 4)
aws s3 sync build/ s3://YOUR_FRONTEND_BUCKET_NAME/

# Find your CloudFront distribution ID
aws cloudfront list-distributions --query "DistributionList.Items[?Comment==''].Id" --output text

# Invalidate CloudFront cache (replace YOUR_DISTRIBUTION_ID)
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### 7. Open Your App

Open the CloudFront URL from step 4 in your browser:
```
https://d1234567890abc.cloudfront.net
```

## Testing Your Deployment

### 1. Upload a Test Document

Create a test file `test.txt`:

```
Our company offers a 30-day money-back guarantee on all products.
Refunds are processed within 5-7 business days.
Customer support is available 24/7 via email and chat.
```

1. Go to **Document Management** tab
2. Upload `test.txt`
3. Wait 1-2 minutes for knowledge base sync

### 2. Ask a Question

Go to **Chat** tab and ask:
```
What is the refund policy?
```

You should see responses from all three models:
- 💜 Claude Sonnet 4
- 💚 Meta Llama 3 70B
- 🧡 Amazon Titan Premier

## Troubleshooting

### ❌ Error: "Model access denied"

**Solution**: Go back to step 1 and ensure model access is approved for all three models (Claude, Llama 3, Titan).

### ❌ Frontend shows "YOUR_API_GATEWAY_URL_HERE"

**Solution**: Update `frontend/src/config.js` with your actual API URL from step 4.

### ❌ "Access Denied" when uploading files

**Solution**:
1. Check S3 bucket CORS settings
2. Verify Lambda has proper IAM permissions
3. Check CloudWatch logs: `aws logs tail /aws/lambda/MultiLlmRagStack-DocumentLambdaXXXXX --follow`

### ❌ No responses from models

**Solution**:
1. Check CloudWatch logs: `aws logs tail /aws/lambda/MultiLlmRagStack-ChatLambdaXXXXX --follow`
2. Ensure knowledge base has documents uploaded
3. Verify all three models have approved access in Bedrock console

### ❌ Llama 3 returns errors

**Solution**: Llama 3 70B might not be available in all regions. Try:
1. Verify region is `us-east-1` (most models available here)
2. Check Bedrock console for model availability in your region
3. If not available, you can switch to Llama 3 8B (`meta.llama3-8b-instruct-v1:0`) in the Lambda code

## Cleanup

When you're done testing:

```bash
cd infrastructure
cdk destroy
```

Type `y` when prompted. This removes all resources and stops billing.

**Note**: OpenSearch Serverless costs ~$0.50/hour even when idle. Don't forget to clean up!

## Cost Monitoring

Set up a billing alert:

1. Go to AWS Console → Billing → Budgets
2. Create a budget (e.g., $50/month)
3. Add email alerts at 80% and 100%

## Benefits of Pure Bedrock

✅ **No External Dependencies** - Everything runs on AWS
✅ **Simpler Setup** - No OpenAI account or API key needed
✅ **Single Bill** - All costs in one AWS account
✅ **Better Security** - All traffic stays within AWS VPC
✅ **Great Performance** - Claude Sonnet 4 often outperforms GPT-4o
✅ **Cost Effective** - Llama 3 is cheaper than GPT-4o

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Upload your company documents
- Start comparing model responses
- Customize the UI in `frontend/src/`
- Add more Bedrock models (Mistral, Cohere, etc.)

## Quick Reference

### Useful Commands

```bash
# View Chat Lambda logs
aws logs tail /aws/lambda/MultiLlmRagStack-ChatLambdaXXXXX --follow

# View Document Lambda logs
aws logs tail /aws/lambda/MultiLlmRagStack-DocumentLambdaXXXXX --follow

# List S3 buckets
aws s3 ls

# Sync frontend after changes
npm run build && aws s3 sync build/ s3://YOUR_FRONTEND_BUCKET/

# Redeploy infrastructure
cd infrastructure && cdk deploy

# Destroy everything
cd infrastructure && cdk destroy
```

### Important Files

- `infrastructure/lib/multi-llm-rag-stack.ts` - Infrastructure definition
- `backend/chat/index.py` - Chat Lambda handler (3 LLMs)
- `backend/documents/index.py` - Document Lambda handler
- `frontend/src/config.js` - API URL configuration
- `frontend/src/App.js` - Main React component

## Support

If you encounter issues:

1. Check CloudWatch logs
2. Review the Troubleshooting section
3. Verify all prerequisites are met
4. Check AWS Bedrock model access is approved for all three models

Happy chatting! 🚀
