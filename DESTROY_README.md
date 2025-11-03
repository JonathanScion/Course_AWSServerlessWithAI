# AWS Infrastructure Destruction Guide

This guide explains how to destroy ALL AWS resources created by this repository.

## ⚠️ WARNING

**This will permanently delete ALL AWS infrastructure including:**
- test-llms-demo (Bedrock, OpenSearch Serverless ~$350/month, Lambda, API Gateway, S3)
- upload-file-demo (S3, Lambda, DynamoDB, CloudWatch, WAF)
- react-node-demo (Lambda, DynamoDB, API Gateway, CloudFront, S3)
- aws-oidc-setup (IAM Role for GitHub Actions)

**This action CANNOT be undone!**

All data will be lost:
- ❌ Uploaded documents in S3
- ❌ Vector embeddings in OpenSearch
- ❌ DynamoDB data
- ❌ CloudWatch logs
- ❌ Lambda functions

## Prerequisites

1. **AWS CLI** installed and configured with credentials
2. **Terraform** installed
3. **Appropriate AWS permissions** (same as what was needed to create resources)

Verify setup:
```bash
aws sts get-caller-identity
terraform --version
```

## Quick Start

### Windows (PowerShell)

```powershell
# From repository root
.\destroy-all.ps1
```

### Mac/Linux (Bash)

```bash
# From repository root
./destroy-all.sh
```

You'll be prompted to type `DESTROY` (case-sensitive) to confirm.

## What the Script Does

1. **Destroys test-llms-demo** (~5-10 minutes)
   - OpenSearch Serverless collection (saves you $350/month!)
   - Bedrock Knowledge Base
   - Lambda functions (chat, documents)
   - API Gateway
   - S3 buckets (documents, frontend)

2. **Destroys upload-file-demo** (~3-5 minutes)
   - Lambda functions (upload, confirm, list, download, delete)
   - DynamoDB table
   - S3 buckets
   - CloudWatch dashboard and alarms
   - API Gateway

3. **Destroys react-node-demo** (~3-5 minutes)
   - Lambda function
   - DynamoDB table
   - API Gateway
   - CloudFront distribution (takes longest)
   - S3 buckets

4. **Destroys aws-oidc-setup** (~1 minute)
   - IAM Role for GitHub Actions
   - IAM Policies
   - OIDC Provider

5. **Cleans up CloudWatch Log Groups**
   - Removes all Lambda log groups
   - Frees up CloudWatch storage

**Total time: 15-25 minutes** (CloudFront distribution takes the longest)

## Destruction Order

The script destroys projects in this order (important for dependencies):
1. test-llms-demo (most dependencies)
2. upload-file-demo
3. react-node-demo
4. aws-oidc-setup (fewest dependencies)

## If Something Fails

If a project fails to destroy, you'll see which one failed. To manually destroy:

```bash
# For test-llms-demo
cd test-llms-demo/terraform
terraform destroy

# For upload-file-demo
cd upload-file-demo/terraform
terraform destroy

# For react-node-demo
cd react-node-demo/terraform
terraform destroy

# For aws-oidc-setup
cd aws-oidc-setup
terraform destroy
```

## Common Issues

### "Resource in use" errors

**OpenSearch Serverless**:
- May take 5-10 minutes to delete
- Script will wait automatically

**CloudFront Distribution**:
- Must be disabled before deletion
- Can take 15-20 minutes
- Terraform handles this automatically

**S3 Buckets**:
- Must be empty before deletion
- Script should handle this, but if not:
  ```bash
  aws s3 rm s3://bucket-name --recursive
  aws s3 rb s3://bucket-name
  ```

### "State lock" errors

If someone else ran Terraform or it crashed mid-run:
```bash
cd <project>/terraform
terraform force-unlock <lock-id>
```

### Permission errors

Ensure your AWS credentials have sufficient permissions:
- IAM full access
- S3 full access
- Lambda full access
- API Gateway full access
- CloudFront full access
- OpenSearch full access
- Bedrock full access
- DynamoDB full access
- CloudWatch full access

## Manual Verification

After running the script, verify everything is gone:

```bash
# Check S3 buckets
aws s3 ls | grep -E "(multi-llm-rag|upload-file-demo|react-node-demo)"

# Check Lambda functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `multi-llm-rag`) || starts_with(FunctionName, `upload-file-demo`) || starts_with(FunctionName, `react-node-demo`)].FunctionName'

# Check DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?starts_with(@, `upload-file-demo`) || starts_with(@, `react-node-demo`)]'

# Check OpenSearch collections
aws opensearchserverless list-collections --query 'collectionSummaries[?starts_with(name, `multi-llm-rag`)].name'

# Check IAM roles
aws iam list-roles --query 'Roles[?starts_with(RoleName, `github-actions-role`)].RoleName'
```

## Cost Savings After Destruction

Once destroyed, you'll stop paying for:
- **OpenSearch Serverless**: ~$350-400/month (biggest savings!)
- **S3 storage**: ~$0.50/month
- **Lambda**: ~$0.50/month
- **API Gateway**: ~$0.01/month
- **DynamoDB**: ~$0.25/month
- **CloudWatch Logs**: ~$0.50/month

**Total savings: ~$352/month**

## Recreating Infrastructure

To recreate everything later:

```bash
# test-llms-demo
cd test-llms-demo/terraform
terraform init
terraform apply

# upload-file-demo
cd upload-file-demo/terraform
terraform init
terraform apply

# react-node-demo
cd react-node-demo/terraform
terraform init
terraform apply

# aws-oidc-setup
cd aws-oidc-setup
terraform init
terraform apply
```

Don't forget to rebuild and deploy frontends!

## Support

If you encounter issues:
1. Check the AWS Console to see what resources still exist
2. Try manual `terraform destroy` for the failing project
3. Check CloudWatch logs for error details
4. Ensure AWS credentials are valid and have sufficient permissions

## Final Note

After running this script:
- ✅ All AWS costs will stop (except any residual charges for the current hour)
- ✅ You can safely delete the repository if desired
- ✅ No AWS resources will remain (verify in AWS Console)
- ✅ GitHub repository and code remain untouched

**Remember**: The OpenSearch Serverless collection is the most expensive resource (~$350/month). Destroying it will save you the most money!
