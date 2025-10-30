# CloudWatch Logs Guide for test-llms-demo

## Overview: Where CloudWatch Fits

```
Your Code (index.py)
    ↓
    print("message")
    ↓
Lambda stdout/stderr
    ↓
CloudWatch Logs (automatic)
    ↓
You view logs in AWS Console or CLI
```

---

## 1. CloudWatch Configuration in This Project

### ✅ Where It's Configured

**Location: `terraform/iam.tf` lines 94-96**

```terraform
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
```

This policy gives Lambda permission to:
- Create CloudWatch Log Groups
- Create CloudWatch Log Streams
- Put log events into CloudWatch

### ✅ What Was Created (Automatically)

**Two Log Groups:**
```
/aws/lambda/multi-llm-rag-chat       (22 KB) ← Chat function logs
/aws/lambda/multi-llm-rag-documents  (450 bytes) ← Documents function logs
```

**Created when:** First time each Lambda function ran
**Retention:** Forever (no expiration set)
**Cost:** Very cheap (first 5 GB/month free, then $0.50/GB)

### ❌ What's NOT Configured

- No explicit CloudWatch resources in Terraform
- No custom log groups
- No log retention policies
- No log subscriptions or filters
- No alarms or metrics

**This is normal!** Lambda creates logs automatically when you attach `AWSLambdaBasicExecutionRole`.

---

## 2. Where Logging Happens in Code

### File: `backend/chat/index.py`

**All logging uses `print()` statements:**

```python
# Line 188 - handler() function
print(f"Retrieving context for question: {question}")

# Line 192 - handler() function
print(f"Retrieved {len(contexts)} context chunks")

# Line 37 - retrieve_from_knowledge_base()
print(f"Error retrieving from knowledge base: {str(e)}")

# Line 78-79 - query_claude()
print(f"Error querying Claude: {str(e)}")
print(traceback.format_exc())

# Line 119-120 - query_llama()
print(f"Error querying Llama: {str(e)}")
print(traceback.format_exc())

# Line 162-163 - query_titan()
print(f"Error querying Titan: {str(e)}")
print(traceback.format_exc())

# Line 235-236 - handler() error handling
print(f"Handler error: {str(e)}")
print(traceback.format_exc())
```

**How it works:**
- `print()` → Python stdout
- Lambda captures stdout
- Lambda sends to CloudWatch automatically
- Appears with timestamp in CloudWatch

**Lambda also automatically logs:**
- `START RequestId: ...` ← Function started
- `END RequestId: ...` ← Function finished
- `REPORT RequestId: ...` ← Duration, memory used, billing

---

## 3. Where to View Logs

### Option A: AWS Console (Easiest & Most Visual) 🖥️

**Step-by-step:**

1. **Open CloudWatch Console**
   ```
   https://console.aws.amazon.com/cloudwatch/
   ```

2. **Navigate to Logs**
   - Left sidebar → "Logs" → "Log groups"

3. **Find Your Log Group**
   ```
   /aws/lambda/multi-llm-rag-chat
   ```

4. **Click the Log Group**
   - Shows list of log streams (one per Lambda invocation)

5. **Click Latest Log Stream** (top one)
   - Format: `2025/10/27/[$LATEST]abc123def456...`

6. **View Logs**
   - See timestamped log messages
   - Can search, filter, download

**What You'll See:**
```
2025-10-27T14:47:32.123Z  START RequestId: abc-123-def
2025-10-27T14:47:32.125Z  Retrieving context for question: What is AWS Lambda?
2025-10-27T14:47:32.890Z  Retrieved 0 context chunks
2025-10-27T14:47:32.891Z  query_titan: Starting...
2025-10-27T14:47:36.234Z  END RequestId: abc-123-def
2025-10-27T14:47:36.234Z  REPORT RequestId: abc-123-def Duration: 4111.23 ms Billed Duration: 4112 ms Memory Size: 512 MB Max Memory Used: 89 MB
```

---

### Option B: AWS CLI (Command Line) 💻

**Method 1: Tail Logs (Live Updates)**
```powershell
# PowerShell (Windows)
aws logs tail /aws/lambda/multi-llm-rag-chat --follow --region us-east-1

# Bash/Linux/Mac
aws logs tail /aws/lambda/multi-llm-rag-chat --follow --region us-east-1
```

**Method 2: Filter Logs (Time Range)**
```powershell
# Last 60 minutes
aws logs filter-log-events `
  --log-group-name /aws/lambda/multi-llm-rag-chat `
  --region us-east-1 `
  --start-time ((Get-Date).AddMinutes(-60).ToUnixTimeMilliseconds())
```

**Method 3: Use Helper Script (RECOMMENDED)**
```powershell
# View chat function logs from last 60 minutes
.\view-cloudwatch-logs.ps1

# View documents function logs from last 30 minutes
.\view-cloudwatch-logs.ps1 -FunctionName multi-llm-rag-documents -MinutesAgo 30

# View with custom parameters
.\view-cloudwatch-logs.ps1 -FunctionName multi-llm-rag-chat -MinutesAgo 120
```

---

### Option C: VS Code Extension (IDE Integration) 🔧

**Setup:**
1. Install "AWS Toolkit" extension in VS Code
2. Click AWS icon in left sidebar
3. Sign in to AWS account
4. Navigate: Lambda → multi-llm-rag-chat
5. Right-click → "View CloudWatch Logs"

**Benefits:**
- View logs without leaving VS Code
- Syntax highlighting
- Easy navigation
- Can invoke Lambda from same interface

---

## 4. Log Structure

### Log Group Hierarchy

```
/aws/lambda/multi-llm-rag-chat          ← Log Group (container)
  ├── 2025/10/27/[$LATEST]abc123...     ← Log Stream (one invocation)
  ├── 2025/10/27/[$LATEST]def456...     ← Log Stream (another invocation)
  └── 2025/10/27/[$LATEST]ghi789...     ← Log Stream (another invocation)
```

**Log Group:**
- One per Lambda function
- Created automatically on first invocation
- Contains all log streams

**Log Stream:**
- One per Lambda container instance
- Multiple invocations may share a stream (if same container reused)
- Format: `YYYY/MM/DD/[version]container-id`

**Log Event:**
- Individual log message
- Has timestamp and message
- Created by `print()` in your code

---

## 5. How to Debug with CloudWatch

### Scenario: API returns error

**Step 1: Trigger the error**
```powershell
curl -X POST "https://bnwq828189.execute-api.us-east-1.amazonaws.com/prod/chat" `
  -H "Content-Type: application/json" `
  -d '{"question":"test"}'
```

**Step 2: View logs immediately**
```powershell
.\view-cloudwatch-logs.ps1 -MinutesAgo 5
```

**Step 3: Look for error patterns**
- `ERROR` - Explicit errors
- `Exception` - Python exceptions
- `Traceback` - Stack traces
- `ValidationException` - AWS API errors
- `AccessDenied` - IAM permission issues

**Step 4: Find the root cause**
```
Example log output:
2025-10-27T14:47:32.890Z  query_claude: Invoking Bedrock model...
2025-10-27T14:47:33.123Z  Error querying Claude: An error occurred (ValidationException)...
2025-10-27T14:47:33.124Z  Traceback (most recent call last):
2025-10-27T14:47:33.125Z    File "index.py", line 65, in query_claude
2025-10-27T14:47:33.126Z      response = bedrock_runtime.invoke_model(...)
```

**This tells you:**
- Which function failed: `query_claude`
- What the error was: `ValidationException`
- Where it failed: `line 65` in `index.py`

---

## 6. Common Log Patterns

### Successful Execution
```
START RequestId: abc-123
Retrieving context for question: What is AWS Lambda?
Retrieved 3 context chunks
query_titan: Success - answer length=234
END RequestId: abc-123
REPORT RequestId: abc-123 Duration: 2000 ms Memory Used: 89 MB
```

### Error Execution
```
START RequestId: xyz-789
Retrieving context for question: test
Retrieved 0 context chunks
Error querying Claude: ValidationException - Model access denied
Traceback (most recent call last):
  File "index.py", line 65, in query_claude
    response = bedrock_runtime.invoke_model(...)
END RequestId: xyz-789
REPORT RequestId: xyz-789 Duration: 1500 ms Memory Used: 85 MB
```

### Timeout
```
START RequestId: def-456
Retrieving context for question: complex query
Retrieved 5 context chunks
query_titan: Starting...
[No END or REPORT - function timed out]
Task timed out after 60.00 seconds
```

---

## 7. Log Retention & Costs

### Current Configuration
- **Retention:** Never expire (kept forever)
- **Size:** 22 KB for chat function
- **Cost:** Negligible (first 5 GB free, then $0.50/GB)

### To Set Retention (Optional)

**Add to `terraform/lambda.tf`:**
```terraform
resource "aws_cloudwatch_log_group" "chat_logs" {
  name              = "/aws/lambda/${aws_lambda_function.chat.function_name}"
  retention_in_days = 7  # or 14, 30, 60, 90, etc.

  lifecycle {
    prevent_destroy = false
  }
}
```

**Common retention periods:**
- 7 days - Development
- 30 days - Staging
- 90 days - Production
- Never expire - Compliance/audit requirements

---

## 8. Quick Reference Commands

```powershell
# View recent logs (PowerShell)
.\view-cloudwatch-logs.ps1

# List all log groups
aws logs describe-log-groups --region us-east-1

# List log groups for this project
aws logs describe-log-groups --region us-east-1 --log-group-name-prefix "/aws/lambda/multi-llm-rag"

# Get latest log stream
aws logs describe-log-streams `
  --log-group-name /aws/lambda/multi-llm-rag-chat `
  --order-by LastEventTime `
  --descending `
  --max-items 1 `
  --region us-east-1

# Search for errors
aws logs filter-log-events `
  --log-group-name /aws/lambda/multi-llm-rag-chat `
  --filter-pattern "ERROR" `
  --region us-east-1

# Get last 50 log events
aws logs filter-log-events `
  --log-group-name /aws/lambda/multi-llm-rag-chat `
  --region us-east-1 `
  --max-items 50
```

---

## 9. Pro Tips

✅ **Always check CloudWatch first** when something fails
✅ **Look for the REPORT line** to see duration and memory
✅ **Search for "ERROR" or "Exception"** to find problems quickly
✅ **Check timestamps** to correlate logs with your test requests
✅ **Use the helper script** for easier log viewing

❌ **Don't log sensitive data** (passwords, API keys, full user data)
❌ **Don't log huge objects** (entire responses, large arrays)
❌ **Don't leave debug logging in production** (use INFO/ERROR only)

---

## Summary

| Question | Answer |
|----------|--------|
| **Where is CloudWatch configured?** | `terraform/iam.tf` - IAM policy attachment (automatic) |
| **Where does logging happen?** | `backend/chat/index.py` - All `print()` statements |
| **Where are logs stored?** | CloudWatch Log Groups: `/aws/lambda/multi-llm-rag-chat` |
| **How to view logs?** | AWS Console, AWS CLI, VS Code Extension, or PowerShell script |
| **What gets logged?** | All `print()` output + Lambda START/END/REPORT messages |
| **Cost?** | Free for first 5 GB/month, then $0.50/GB |
| **Retention?** | Forever (no expiration currently set) |
