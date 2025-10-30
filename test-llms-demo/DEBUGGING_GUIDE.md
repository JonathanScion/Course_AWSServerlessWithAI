# Lambda Debugging Guide

## Two Main Approaches

### 1. CloudWatch Logs (Production Debugging) ✅ RECOMMENDED FIRST

**Best for:**
- AWS-specific errors (IAM, Bedrock, Knowledge Base)
- Real environment issues
- Quick diagnosis without code changes

**How to use:**

#### Option A: AWS Console (Easiest)
1. Go to https://console.aws.amazon.com/cloudwatch/
2. Navigate to "Logs" → "Log groups"
3. Find `/aws/lambda/multi-llm-rag-chat`
4. Click on the latest log stream
5. See real-time logs

#### Option B: Command Line
```bash
# View recent logs (using helper script)
bash test-llms-demo/view-logs.sh multi-llm-rag-chat 60

# Or use AWS CLI directly
aws logs tail /aws/lambda/multi-llm-rag-chat --follow --region us-east-1
```

#### Option C: VS Code Extension
1. Install "AWS Toolkit" extension for VS Code
2. Sign in to AWS
3. Navigate to Lambda → multi-llm-rag-chat
4. View logs directly in VS Code

**Pros:**
✅ Real AWS environment (actual IAM, Bedrock, Knowledge Base)
✅ See actual production errors
✅ No code changes needed
✅ Fast feedback (just invoke and check)

**Cons:**
❌ Need to redeploy for code changes
❌ Harder to step through code
❌ Slower iteration for complex debugging

---

### 2. Local Debugging (Development) 🔧

**Best for:**
- Logic bugs
- Algorithm issues
- Testing different inputs quickly
- Understanding code flow

**How to use:**

#### Step 1: Set up Python environment
```bash
cd test-llms-demo/backend/chat
python -m pip install boto3
```

#### Step 2: Open VS Code
1. Open `test-llms-demo/backend/chat/index.py`
2. Set breakpoints (click left of line numbers)
3. Press `F5` or click "Run and Debug"
4. Select "Debug Lambda: Chat Function"

#### Step 3: Debug!
- Step through code line by line
- Inspect variables
- Modify inputs in `local_test.py`

**Pros:**
✅ Set breakpoints
✅ Step through code
✅ Inspect all variables
✅ Fast iteration (no deployment)
✅ Test edge cases easily

**Cons:**
❌ **Different environment** - AWS services behave differently locally
❌ Must have valid AWS credentials
❌ Network latency different from Lambda
❌ May not catch AWS-specific issues

---

## Context Differences: Local vs Lambda

### What's DIFFERENT locally:

| Aspect | Local | Lambda (AWS) |
|--------|-------|--------------|
| **IAM Permissions** | Your personal AWS credentials | Lambda execution role |
| **Network** | Your internet | AWS VPC/network |
| **Region** | Configured in code | Deployed region |
| **Timeout** | No limit | 60 seconds (configurable) |
| **Memory** | Your computer | 512 MB (configurable) |
| **Dependencies** | Your installed packages | Lambda layer / deployment package |
| **Logs** | Terminal/console | CloudWatch |
| **Cold Start** | No | Yes (first invocation) |

### What's the SAME:

✅ Your Python code logic
✅ AWS SDK (boto3) behavior
✅ Bedrock API calls (uses your credentials)
✅ Knowledge Base queries (if you have access)
✅ Request/response structure

---

## Recommended Workflow

### For AWS-Specific Issues (IAM, Bedrock errors):

```
1. Make a test request
   curl -X POST "https://bnwq828189.execute-api.us-east-1.amazonaws.com/prod/chat" \
     -H "Content-Type: application/json" \
     -d '{"question":"test"}'

2. Check CloudWatch logs immediately
   aws logs tail /aws/lambda/multi-llm-rag-chat --follow

3. Find the error
   Look for "ERROR" or "Exception" lines

4. Fix the issue (IAM policy, model ID, etc.)

5. Deploy with Terraform
   cd terraform && terraform apply

6. Test again
```

### For Logic Issues:

```
1. Add logging to suspect code
   logger.info(f"Debug: variable_name={variable_name}")

2. Run locally with debugger
   python backend/chat/local_test.py

3. Set breakpoint on suspect line

4. Step through and inspect variables

5. Fix the bug

6. Test locally again

7. When working, deploy to AWS
   cd terraform && terraform apply
```

---

## Enhanced Logging

I've created `index_with_logging.py` with better logging. To use it:

```bash
# Backup original
cp backend/chat/index.py backend/chat/index.backup.py

# Use enhanced version
cp backend/chat/index_with_logging.py backend/chat/index.py

# Deploy
cd terraform && terraform apply
```

**Benefits:**
- Structured log messages with prefixes
- Shows function entry/exit
- Logs variable sizes (not full content - avoid logging sensitive data)
- Error context with stack traces
- Request IDs for tracing

**Example log output:**
```
2025-10-27 14:30:15 INFO handler: START - request_id=abc123
2025-10-27 14:30:15 INFO handler: Question received - 'What is AWS Lambda?'
2025-10-27 14:30:15 INFO retrieve_from_knowledge_base: Starting - query='What is AWS Lambda?', max_results=5
2025-10-27 14:30:16 INFO retrieve_from_knowledge_base: Success - retrieved 3 contexts
2025-10-27 14:30:16 INFO query_titan: Starting - question length=17, context length=450
2025-10-27 14:30:17 INFO query_titan: Success - answer length=234
2025-10-27 14:30:17 INFO handler: SUCCESS - request_id=abc123, contexts=3, responses=3
```

---

## Quick Commands Reference

```bash
# View logs (last 60 minutes)
bash view-logs.sh multi-llm-rag-chat 60

# Test API endpoint
curl -X POST "https://bnwq828189.execute-api.us-east-1.amazonaws.com/prod/chat" \
  -H "Content-Type: application/json" \
  -d '{"question":"What is AWS Lambda?"}'

# Run local test
cd backend/chat && python local_test.py

# Deploy changes
cd terraform && terraform apply

# Check Lambda function details
aws lambda get-function --function-name multi-llm-rag-chat --region us-east-1

# Invoke Lambda directly (bypass API Gateway)
aws lambda invoke \
  --function-name multi-llm-rag-chat \
  --region us-east-1 \
  --payload '{"body":"{\"question\":\"test\"}"}' \
  response.json && cat response.json
```

---

## When Something Goes Wrong

### Step 1: Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/multi-llm-rag-chat --follow --region us-east-1
```

### Step 2: Identify Error Type

**If you see:**
- `ValidationException` → Model access issue or wrong model ID
- `AccessDeniedException` → IAM permissions problem
- `ResourceNotFoundException` → Knowledge Base or resource doesn't exist
- `ThrottlingException` → Too many requests
- `TimeoutError` → Function taking too long
- `KeyError` → Missing expected data in response

### Step 3: Fix Based on Error

| Error Type | Where to Look | How to Fix |
|------------|---------------|------------|
| Model access | AWS Console → Bedrock → Model access | Request model access |
| IAM | `terraform/iam.tf` | Add missing permissions |
| Timeout | `terraform/lambda.tf` | Increase timeout value |
| Logic bug | Use local debugger | Set breakpoint, step through |
| Missing env var | `terraform/lambda.tf` | Add to environment variables |

---

## Pro Tips

1. **Start with CloudWatch** - It's faster to check logs than deploy code changes
2. **Use structured logging** - Prefix messages with function name
3. **Log entry/exit** - Know which function is executing
4. **Don't log sensitive data** - Avoid logging full prompts or responses
5. **Use log levels** - INFO for normal, ERROR for problems, DEBUG for details
6. **Test locally first** - Catch simple bugs before deploying
7. **Keep local and AWS in sync** - Same boto3 version, same Python version

---

## Common Gotchas

❌ **Don't do this:**
```python
print(response)  # Logs entire response (can be huge!)
```

✅ **Do this instead:**
```python
logger.info(f"Response keys: {response.keys()}")
logger.info(f"Response length: {len(response.get('body', ''))}")
```

❌ **Don't do this:**
```python
except Exception:
    pass  # Silent failure, no idea what went wrong
```

✅ **Do this instead:**
```python
except Exception as e:
    logger.error(f"Error: {str(e)}", exc_info=True)
    raise
```
