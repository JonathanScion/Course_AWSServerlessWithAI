# AWS Serverless Deployment Guide

## Prerequisites

1. **AWS Account**: You need an active AWS account
2. **AWS CLI**: Install and configure AWS CLI with your credentials
   - Windows: Download from https://aws.amazon.com/cli/
   - Mac: `brew install awscli`
   - Linux: `pip install awscli`
3. **Terraform**: Install Terraform
   - Download from https://www.terraform.io/downloads
4. **Node.js**: Ensure Node.js is installed (for building React app)

## Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region (e.g., us-east-1)
# Enter default output format (json)
```

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

**Windows (PowerShell):**
```powershell
.\deploy.ps1
```

**Mac/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

1. **Initialize Terraform:**
```bash
cd terraform
terraform init
```

2. **Review the deployment plan:**
```bash
terraform plan
```

3. **Apply Terraform configuration:**
```bash
terraform apply
# Type 'yes' when prompted
```

4. **Get the API Gateway URL:**
```bash
terraform output api_gateway_url
```

5. **Update React app with API URL:**
```bash
cd ../client
# Update .env.production with the API Gateway URL
echo "REACT_APP_API_URL=<YOUR_API_GATEWAY_URL>" > .env.production
```

6. **Build React app:**
```bash
npm run build
```

7. **Deploy to S3:**
```bash
# Get bucket name from Terraform
cd ../terraform
BUCKET_NAME=$(terraform output -raw s3_bucket_name)
cd ../client
aws s3 sync build/ s3://$BUCKET_NAME --delete
```

## Access Your Application

After deployment, you can access:
- **Website**: Check the S3 website URL from Terraform outputs
- **API**: The API Gateway URL will be displayed in outputs

```bash
cd terraform
terraform output website_url
terraform output api_gateway_url
```

## Updating the Application

### Update Lambda Function:
1. Modify `terraform/lambda/index.js`
2. Run `terraform apply` in the terraform directory

### Update React App:
1. Make changes to React code
2. Run `npm run build` in client directory
3. Sync to S3: `aws s3 sync build/ s3://$BUCKET_NAME --delete`

## Destroy Resources

To remove all AWS resources and avoid charges:

```bash
cd terraform
terraform destroy
# Type 'yes' when prompted
```

## Cost Estimates

With AWS Free Tier:
- **Lambda**: 1M free requests/month
- **API Gateway**: 1M free API calls/month
- **S3**: 5GB free storage

For a low-traffic app, you'll likely stay within free tier limits.

## Troubleshooting

### "Access Denied" errors:
- Ensure your AWS credentials have necessary permissions
- Check IAM policies for Lambda, S3, and API Gateway access

### CORS errors:
- The Lambda function already includes CORS headers
- Verify API Gateway URL in React app configuration

### React app not updating:
- Clear browser cache
- Ensure S3 sync completed successfully
- Check CloudFront distribution if using CDN

## Architecture

```
User Browser
     ↓
S3 Static Website (React App)
     ↓
API Gateway
     ↓
Lambda Function (Node.js)
```

## Security Notes

- Lambda function has minimal IAM permissions
- S3 bucket is configured for public read access (website only)
- API Gateway is public but can be secured with API keys if needed
- Consider adding CloudFront CDN for HTTPS and better performance