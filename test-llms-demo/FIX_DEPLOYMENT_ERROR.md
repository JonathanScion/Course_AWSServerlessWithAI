# Fix for OpenSearch Serverless Deployment Error

## What Was Wrong

The Knowledge Base was trying to access the OpenSearch Serverless collection before:
1. The collection was fully active
2. The data access policy was properly configured
3. The AWS account root principal had access to bootstrap the index

## What Was Fixed

### 1. Added AWS Account Root to Data Access Policy
The Knowledge Base needs the AWS account to be able to create the initial index in OpenSearch. Added:
```typescript
const dataAccessPolicyPrincipals = [
  knowledgeBaseRole.roleArn,
  `arn:aws:iam::${this.account}:root`, // Allow account root to bootstrap
];
```

### 2. Fixed Dependency Chain
Ensured proper resource creation order:
```
1. OpenSearch Collection created
2. Data Access Policy created (depends on Collection)
3. Knowledge Base created (depends on BOTH Collection and Policy)
```

### 3. Explicit Dependencies
```typescript
// Data access policy must wait for collection
dataAccessPolicy.addDependency(vectorCollection);

// Knowledge Base must wait for both
knowledgeBase.addDependency(vectorCollection);
knowledgeBase.addDependency(dataAccessPolicy);
```

## How to Redeploy

### Step 1: Clean Up the Failed Stack

The stack is in `ROLLBACK_COMPLETE` state, so we need to delete it first:

**Option A: AWS Console (Easier)**
1. Go to [AWS CloudFormation Console](https://console.aws.amazon.com/cloudformation/)
2. Find stack: `MultiLlmRagStack`
3. Select it and click **Delete**
4. Wait 2-3 minutes for deletion to complete

**Option B: AWS CLI**
```bash
aws cloudformation delete-stack --stack-name MultiLlmRagStack

# Wait for deletion (check status)
aws cloudformation describe-stacks --stack-name MultiLlmRagStack
# Should eventually show "Stack with id MultiLlmRagStack does not exist"
```

### Step 2: Redeploy with Fixed Code

```bash
cd infrastructure

# The code is already fixed, just deploy again
cdk deploy
```

This time it should succeed! ⏱️ Takes 10-15 minutes.

## Why This Error Happened

This is a **common issue** with Bedrock Knowledge Base + OpenSearch Serverless. The problem is:

1. **OpenSearch Serverless collections take time to become active** (~5 minutes)
2. **Data access policies need to propagate** (~1-2 minutes)
3. **Knowledge Base tries to validate the connection immediately** (fails if not ready)

The fix ensures:
- ✅ Collection is created first
- ✅ Data access policy includes account root (for initial setup)
- ✅ Knowledge Base waits for both to be ready
- ✅ Proper dependency chain prevents race conditions

## Verification After Deployment

After successful deployment:

1. **Check OpenSearch Collection**
   ```bash
   aws opensearchserverless list-collections
   ```
   Should show: `multi-llm-rag-vectors` with status `ACTIVE`

2. **Check Knowledge Base**
   ```bash
   aws bedrock-agent list-knowledge-bases
   ```
   Should show: `MultiLlmRagKnowledgeBase`

3. **Check Data Source**
   ```bash
   # Replace KB_ID with your Knowledge Base ID from outputs
   aws bedrock-agent list-data-sources --knowledge-base-id KB_ID
   ```
   Should show: `S3DocumentSource`

## If It Still Fails

### Check Bedrock Service Quotas
```bash
aws service-quotas get-service-quota \
  --service-code bedrock \
  --quota-code L-9DFCD04C  # Knowledge Bases per account
```

### Check OpenSearch Serverless Quotas
```bash
aws service-quotas list-service-quotas \
  --service-code aoss \
  --query "Quotas[?QuotaName.contains(@, 'collections')]"
```

### Check IAM Permissions
Ensure your AWS account has these permissions:
- `bedrock:*`
- `aoss:*` (OpenSearch Serverless)
- `iam:CreateRole`
- `iam:AttachRolePolicy`
- `s3:CreateBucket`

### Enable CloudFormation Stack Termination Protection (Optional)
After successful deployment:
```bash
aws cloudformation update-termination-protection \
  --stack-name MultiLlmRagStack \
  --enable-termination-protection
```

## Common Questions

**Q: Why does OpenSearch Serverless take so long?**
A: It provisions dedicated compute and storage. Vector search collections are more complex than regular search.

**Q: Can I skip OpenSearch and use something else?**
A: Yes! You can use:
- Amazon Aurora with pgvector
- Amazon RDS with pgvector
- Pinecone (external service)

But OpenSearch Serverless is fully managed and integrates natively with Bedrock Knowledge Base.

**Q: Why is OpenSearch Serverless so expensive?**
A: It charges ~$0.50/hour even when idle. For production, consider Aurora pgvector which only charges for storage when idle.

## Next Steps

Once deployment succeeds:
1. Save the outputs (API URL, CloudFront URL, etc.)
2. Configure frontend with API URL
3. Build and deploy frontend
4. Test by uploading a document and asking questions

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete instructions.
