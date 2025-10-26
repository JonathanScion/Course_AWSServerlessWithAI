# Quick Start - Multi-LLM RAG Chatbot (Pure Bedrock)

Get up and running in 25 minutes!

## What You'll Build

A chatbot that:
- Accepts ONE question from the user
- Returns THREE answers from Claude Sonnet 4, Meta Llama 3, and Amazon Titan
- All answers are based on YOUR uploaded documents (RAG)
- Includes a file management interface
- **100% AWS Bedrock** - No external API keys needed!

## Prerequisites (5 minutes)

### 1. Install Required Tools

```bash
# AWS CLI
aws --version  # Should be 2.x

# Node.js
node --version  # Should be 18+

# AWS CDK
npm install -g aws-cdk
cdk --version
```

### 2. Configure AWS

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Region: us-east-1 (recommended)
```

### 3. Request Bedrock Model Access

Go to [Bedrock Console](https://console.aws.amazon.com/bedrock/) → Model access → Request access to:
- ✅ Claude Sonnet 4
- ✅ Meta Llama 3 70B
- ✅ Amazon Titan Premier
- ✅ Amazon Titan Embeddings

**That's it!** No OpenAI account, no external API keys. Everything runs on AWS.

## Installation (5 minutes)

```bash
# Navigate to project
cd Test_LLMs

# Install dependencies
cd infrastructure && npm install
cd ../frontend && npm install
```

## Deploy Backend (15 minutes)

```bash
cd infrastructure

# First time only
cdk bootstrap

# Deploy (grab a coffee, this takes ~15 min)
cdk deploy
```

**Save the outputs!** You'll see:
```
MultiLlmRagStack.ApiUrl = https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/
MultiLlmRagStack.CloudFrontUrl = https://xxxxx.cloudfront.net
MultiLlmRagStack.FrontendBucketName = multiLlmragstack-frontendbucket-xxxxx
```

## Deploy Frontend (3 minutes)

### 1. Configure API URL

Edit `frontend/src/config.js`:
```javascript
export const API_URL = 'https://xxxxx.execute-api.us-east-1.amazonaws.com/prod';
```
(Use the ApiUrl from above, remove trailing slash)

### 2. Build and Deploy

```bash
cd frontend
npm run build

# Replace YOUR_BUCKET with FrontendBucketName from outputs
aws s3 sync build/ s3://YOUR_BUCKET/

# Optional: Invalidate CloudFront cache for instant updates
aws cloudfront create-invalidation \
  --distribution-id $(aws cloudfront list-distributions --query "DistributionList.Items[0].Id" --output text) \
  --paths "/*"
```

## Test It! (5 minutes)

### 1. Open the App

Visit the CloudFront URL from the deployment outputs:
```
https://xxxxx.cloudfront.net
```

### 2. Upload a Test Document

Click **Document Management** tab.

Create `test.txt`:
```
Company Policy: All employees get 15 vacation days per year.
Remote work is allowed 3 days per week.
Health insurance covers dental and vision.
```

Upload the file. Wait ~2 minutes for sync.

### 3. Ask a Question

Click **Chat** tab.

Ask: `How many vacation days do employees get?`

You'll see 3 responses appear side-by-side:
- 💜 **Claude Sonnet 4** (purple panel)
- 💚 **Meta Llama 3** (green panel)
- 🧡 **Amazon Titan** (orange panel)

## Common Issues

### "Model access denied"
→ Go to Bedrock console and approve model access for all three models

### Frontend shows "YOUR_API_GATEWAY_URL_HERE"
→ Update `frontend/src/config.js` with your API URL

### No answers after 30 seconds
→ Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/MultiLlmRagStack-ChatLambda* --follow
```

## What's Next?

✅ **Working?** Upload your company docs and start testing!

📚 **Learn More:**
- [README.md](README.md) - Full documentation
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Detailed deployment steps
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Code organization

🔧 **Customize:**
- Edit UI colors in `frontend/src/App.css`
- Add more Bedrock models in `backend/chat/index.py`
- Adjust Lambda timeout in CDK stack

## Cleanup

When done testing:
```bash
cd infrastructure
cdk destroy
```

This removes all AWS resources and stops billing.

**Note:** OpenSearch Serverless costs ~$0.50/hour even when idle. Don't forget to destroy!

## Cost Estimate

- **Development/Testing**: ~$15-20/month (mostly OpenSearch)
- **Per 1000 queries**: ~$11 (vs $13 with OpenAI)
- **Production**: ~$360/month base + usage

Set up billing alerts: AWS Console → Billing → Budgets

## Why Pure Bedrock?

✅ **Simpler** - No external API keys or accounts
✅ **Cheaper** - Llama 3 is more cost-effective than GPT-4o
✅ **Unified** - Single AWS bill, single authentication
✅ **Secure** - All traffic stays within AWS
✅ **Great Models** - Claude is arguably better than GPT-4o anyway!

---

**That's it!** You now have a working multi-LLM comparison chatbot with RAG, all on AWS Bedrock. 🎉
