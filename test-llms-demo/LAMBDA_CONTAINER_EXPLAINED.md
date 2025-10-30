# Lambda Container: Where It's Built and How Dependencies Work

## The Big Picture: You DON'T Build the Container!

**Surprising truth:** In your project, **no container is built**. AWS provides a pre-built container with Python and common libraries already installed.

---

## Your Deployment Method: ZIP + AWS Managed Runtime

Your project uses **ZIP deployment**, not container images. Here's what happens:

### Step 1: Local Packaging (Terraform)

**File: `terraform/lambda.tf` lines 2-6**

```terraform
data "archive_file" "chat_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/chat"      # ← Takes files from here
  output_path = "${path.module}/lambda_packages/chat_function.zip"  # ← Creates ZIP
}
```

**What gets zipped:**
```
backend/chat/
  ├── index.py              ← Your code
  └── requirements.txt      ← Dependency list (boto3>=1.34.0)
```

**Result:** `lambda_packages/chat_function.zip` (7.6 KB)

**What's MISSING from the ZIP:**
- ❌ No boto3 library
- ❌ No Python runtime
- ❌ No operating system
- ❌ No container definition

### Step 2: Upload to AWS (Terraform)

**File: `terraform/lambda.tf` lines 16-24**

```terraform
resource "aws_lambda_function" "chat" {
  filename         = data.archive_file.chat_lambda.output_path  # ← Upload the ZIP
  function_name    = "${local.project_name}-chat"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.chat_lambda.output_base64sha256
  runtime          = "python3.11"  # ← THIS tells AWS which container to use!
  timeout          = var.lambda_timeout
  memory_size      = var.chat_lambda_memory
```

**Key line:** `runtime = "python3.11"`

This tells AWS: "Use your pre-built Python 3.11 container"

### Step 3: AWS Builds the Container (Automatic)

When you specify `runtime = "python3.11"`, AWS uses a **pre-built base image** that already contains:

```
AWS Python 3.11 Container (Pre-built by AWS)
├── Amazon Linux 2
├── Python 3.11.x runtime
├── boto3 (AWS SDK)              ← Already installed!
├── botocore                     ← Already installed!
├── urllib3, requests, etc.      ← Already installed!
└── Lambda runtime API
```

Then AWS **adds your code on top**:

```
Final Container = AWS Base Image + Your Code
├── [AWS Python 3.11 base]
└── /var/task/
    ├── index.py              ← Your code
    └── requirements.txt      ← Not actually used!
```

---

## Where This Happens (Timeline)

### When You Run `terraform apply`:

```
Your Machine:
    1. Terraform reads lambda.tf
       ↓
    2. Terraform zips backend/chat/ → chat_function.zip
       ↓
    3. Terraform uploads ZIP to AWS Lambda service
       ↓
AWS:
    4. AWS stores your ZIP in S3 (internal)
       ↓
    5. AWS creates Lambda function metadata
       ↓
    [Container NOT created yet!]
```

### When Someone Calls Your API (First Time):

```
AWS Lambda Service:
    1. Request received
       ↓
    2. AWS selects: "Python 3.11" container image (pre-built)
       ↓
    3. AWS starts container from that image
       ↓
    4. AWS downloads your ZIP from S3
       ↓
    5. AWS extracts index.py into /var/task/
       ↓
    6. Container starts, imports your code
       ↓
    7. Your handler() function runs
       ↓
    [Container now running with your code + AWS's Python + boto3]
```

---

## The "requirements.txt" Mystery

### Wait, You Have requirements.txt But It's Not Used?

**Correct!** Your `requirements.txt` contains:
```
boto3>=1.34.0
```

But this file **is NOT processed** because:

1. ✅ **boto3 is pre-installed** in AWS's Python 3.11 runtime
2. ❌ **No pip install happens** during deployment
3. ❌ **No dependencies are installed** from requirements.txt

### When IS requirements.txt Used?

Only if you:
- Use a Lambda Layer
- Build a custom container image
- Use a tool that pre-installs dependencies before zipping

**In your current setup: requirements.txt is just documentation!**

---

## GitHub Actions (If You Use It)

**File: `.github/workflows/deploy-test-llms-demo.yml`**

Lines 43-53 show what GitHub Actions does:

```yaml
- name: Terraform Init
  working-directory: ./test-llms-demo/terraform
  run: terraform init

- name: Terraform Plan
  working-directory: ./test-llms-demo/terraform
  run: terraform plan -out=tfplan

- name: Terraform Apply
  working-directory: ./test-llms-demo/terraform
  run: terraform apply -auto-approve tfplan
```

**No container building!** It just:
1. Runs Terraform (which creates ZIP)
2. Terraform uploads ZIP to AWS
3. AWS handles the rest

---

## What If You Needed Custom Dependencies?

If you needed a library NOT in AWS's base image (e.g., `pandas`, `numpy`), you'd have **3 options**:

### Option 1: Lambda Layer (Easiest)

Create a separate ZIP with dependencies:

```bash
# Create layer
mkdir python
pip install pandas -t python/
zip -r layer.zip python/

# In Terraform, add layer
resource "aws_lambda_layer_version" "dependencies" {
  filename   = "layer.zip"
  layer_name = "python-dependencies"
  compatible_runtimes = ["python3.11"]
}

resource "aws_lambda_function" "chat" {
  ...
  layers = [aws_lambda_layer_version.dependencies.arn]
}
```

### Option 2: Include in ZIP

Install dependencies locally, then zip:

```bash
cd backend/chat
pip install -r requirements.txt -t .
zip -r function.zip .
```

Problem: ZIP can get huge (pandas = 100+ MB)

### Option 3: Container Image (Most Flexible)

Write a Dockerfile:

```dockerfile
FROM public.ecr.aws/lambda/python:3.11

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY index.py .

CMD ["index.handler"]
```

Build and push to ECR, then deploy:

```terraform
resource "aws_lambda_function" "chat" {
  image_uri    = "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-image:latest"
  package_type = "Image"
  ...
}
```

---

## Your Project's Actual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Development Machine                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. You edit: backend/chat/index.py                          │
│                                                               │
│  2. You run: terraform apply                                 │
│     ↓                                                         │
│     Terraform reads lambda.tf                                │
│     ↓                                                         │
│     Terraform zips backend/chat/ → chat_function.zip         │
│     (Contains: index.py + requirements.txt)                  │
│     ↓                                                         │
│     Terraform uploads chat_function.zip to AWS               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      AWS Lambda Service                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  3. AWS stores ZIP in internal S3                            │
│                                                               │
│  4. [Container NOT created yet - waiting for request]        │
│                                                               │
└─────────────────────────────────────────────────────────────┘

[Time passes... someone calls your API]

┌─────────────────────────────────────────────────────────────┐
│                      AWS Lambda Service                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  5. Request received!                                        │
│     ↓                                                         │
│     AWS creates container from pre-built "python:3.11" image │
│     ↓                                                         │
│     Container structure:                                     │
│     ┌──────────────────────────────────────────────┐        │
│     │  AWS Python 3.11 Container (Pre-built)       │        │
│     │  ├── Amazon Linux 2                          │        │
│     │  ├── Python 3.11                             │        │
│     │  ├── boto3 ← Already here!                   │        │
│     │  ├── /var/task/                              │        │
│     │  │   ├── index.py ← Your code extracted      │        │
│     │  │   └── requirements.txt ← Ignored          │        │
│     └──────────────────────────────────────────────┘        │
│     ↓                                                         │
│     Container starts, runs: python index.handler()           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

### Where Is the Container Built?

**Nowhere!** You don't build it. AWS provides a pre-built container.

### When Is the Container Created?

**First API request** - not during `terraform apply`

### Where Are Dependencies?

- ✅ **boto3**: Pre-installed in AWS's Python 3.11 image
- ✅ **Python 3.11**: Pre-installed in AWS's image
- ✅ **OS (Amazon Linux)**: Pre-installed in AWS's image

### What Do You Control?

| You Control | AWS Provides |
|-------------|--------------|
| Your Python code (index.py) | Python 3.11 runtime |
| Environment variables | boto3 library |
| Memory/timeout settings | Operating system |
| IAM permissions | Container infrastructure |
|  | Networking |
|  | Scaling |

### Your Workflow:

```
Edit code → terraform apply → ZIP created → ZIP uploaded → Done!
                                                            ↓
                                        [AWS handles container on first request]
```

---

## Comparison: ZIP vs Container Image

### Your Current Setup (ZIP):

```
✅ Simple - just upload code
✅ Fast deployment (7.6 KB)
✅ AWS manages runtime updates
❌ Limited to AWS-provided runtimes
❌ Limited control over dependencies
```

### Alternative (Container Image):

```
✅ Full control over environment
✅ Can use any base image
✅ Can install any dependencies
❌ More complex to build
❌ Larger deployments (100+ MB typical)
❌ You must update base images
```

---

## Summary

**Your question:** "Where is the container built?"

**Answer:**
- ❌ Not in Terraform
- ❌ Not in GitHub Actions
- ❌ Not on your machine
- ✅ **AWS builds it automatically** when the first request arrives
- ✅ **AWS uses a pre-built Python 3.11 image** that already has boto3

**Your code (index.py) is simply extracted into the container at `/var/task/`**

The "container building" is invisible to you - that's the whole point of serverless! 🎯
