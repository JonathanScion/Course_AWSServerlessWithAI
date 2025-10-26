# OIDC Setup for GitHub Actions

Follow these steps to enable secure, keyless authentication from GitHub Actions to AWS.

## Prerequisites
- AWS CLI installed and configured
- Admin access to AWS account
- Your GitHub repository name

## Setup Options

Choose either the **Terraform approach** (recommended) or **Manual approach**:

---

## Option A: Terraform Setup (Recommended)

### Why Terraform?
- ✅ Infrastructure as Code - version controlled and reproducible
- ✅ Easy to tear down and recreate
- ✅ Automatically includes all required permissions (including OpenSearch Serverless and Bedrock)
- ✅ Self-documenting

### Steps

1. **Navigate to the setup directory**:
   ```bash
   cd aws-oidc-setup
   ```

2. **Initialize Terraform**:
   ```bash
   terraform init
   ```

3. **Review the plan**:
   ```bash
   terraform plan -var="github_org=YourGitHubUsername"
   ```
   Replace `YourGitHubUsername` with your actual GitHub username (e.g., `JonathanScion`)

4. **Apply the configuration**:
   ```bash
   terraform apply -var="github_org=YourGitHubUsername"
   ```

5. **Copy the Role ARN from the output** and follow the instructions to add it to GitHub Secrets

6. **Done!** Your OIDC setup is complete and version controlled.

### Updating Permissions

If you need to add more AWS permissions in the future:
1. Edit `main.tf` and add the permissions to the policy
2. Run `terraform apply -var="github_org=YourGitHubUsername"`
3. Changes are automatically applied

### Cleanup

To remove the OIDC setup:
```bash
terraform destroy -var="github_org=YourGitHubUsername"
```

---

## Option B: Manual Setup

### Step-by-Step Instructions

### Step 1: Update Configuration Files

1. Open `trust-policy.json`
2. Replace `YOUR_AWS_ACCOUNT_ID` with your AWS account ID (get it by running `aws sts get-caller-identity`)
3. Replace `YOUR_GITHUB_USERNAME` with your GitHub username (e.g., `JonathanScion`)

### Step 2: Run Setup Script

**Option A: Using the script (Linux/Mac)**
```bash
cd aws-oidc-setup
chmod +x setup-commands.sh
./setup-commands.sh
```

**Option B: Manual commands (Windows/any)**

```bash
# 1. Create OIDC Provider (ONE-TIME per AWS account)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2. Create IAM Role
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://trust-policy.json

# 3. Attach permissions
aws iam put-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-name GitHubActionsDeployPolicy \
  --policy-document file://permissions-policy.json

# 4. Get the Role ARN (copy this!)
aws iam get-role --role-name GitHubActionsDeployRole --query Role.Arn --output text
```

### Step 3: Add Role ARN to GitHub

1. Go to your GitHub repo: https://github.com/YOUR_USERNAME/Course_AWSServerlessWithAI
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AWS_ROLE_ARN`
5. Value: Paste the Role ARN from Step 2 (looks like `arn:aws:iam::123456789012:role/GitHubActionsDeployRole`)
6. Click **Add secret**

### Step 4: Clean Up Old Secrets (Optional)

Since you're now using OIDC, you can delete these old secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Verification

Push to your repository and check the Actions tab. The deployment should authenticate using OIDC without any stored credentials!

## Troubleshooting

**Error: "Not authorized to perform sts:AssumeRoleWithWebIdentity"**
- Check that the GitHub username in `trust-policy.json` matches exactly
- Verify the repo name is correct

**Error: "OIDC provider does not exist"**
- The provider thumbprint may have changed. Get the latest:
  ```bash
  aws iam list-open-id-connect-providers
  ```

## Security Benefits

✅ No long-lived credentials stored in GitHub
✅ Temporary credentials (valid for 1 hour)
✅ Automatic rotation
✅ Least privilege access
✅ Audit trail in AWS CloudTrail
