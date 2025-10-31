# CORS Error Fix Guide

## The Error That Keeps Haunting Us

```
Access to XMLHttpRequest at 'https://bnwq828189.execute-api.us-east-1.amazonaws.com/prod/chat'
from origin 'https://d2ng4r0rqkdhfd.cloudfront.net' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Causes

This error happens when:

1. **Lambda code is broken** (500/502 errors don't return CORS headers)
2. **Lambda isn't deployed** after code changes
3. **API Gateway isn't configured properly** (rare, since terraform handles this)

## The Fix (Step by Step)

### Step 1: Verify Lambda Code Returns CORS Headers

**File: `backend/chat/index.py`**

Every return statement MUST have these headers:

```python
return {
    'statusCode': 200,  # or 400, 500, etc.
    'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'  # ← THIS IS CRITICAL!
    },
    'body': json.dumps(response_data)
}
```

**Check all return statements:**
- ✅ Success responses (200)
- ✅ Error responses (400, 500)
- ✅ Every single return!

### Step 2: Test Lambda Locally First

```bash
cd test-llms-demo/backend/chat
python local_test.py
```

If this fails, fix the Python code BEFORE deploying.

### Step 3: Deploy with Terraform

```bash
cd test-llms-demo/terraform
terraform apply -auto-approve
```

Wait for: `aws_lambda_function.chat: Modifications complete`

### Step 4: Test the API

```bash
curl -X POST "https://bnwq828189.execute-api.us-east-1.amazonaws.com/prod/chat" \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}' \
  -i
```

Look for:
```
HTTP/2 200
access-control-allow-origin: *  ← Should see this!
```

### Step 5: Clear Browser Cache

Sometimes the browser caches the CORS error:

1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Try your request again

---

## Common Mistakes That Break CORS

### ❌ Mistake 1: Using `logger` Instead of `print()`

**Don't do this:**
```python
import logging
logger = logging.getLogger()
logger.info("message")
```

**Do this:**
```python
print("message")
```

**Why?** The logging setup can break Lambda if not done carefully. `print()` always works.

### ❌ Mistake 2: Missing CORS Headers in Error Responses

**Don't do this:**
```python
except Exception as e:
    return {
        'statusCode': 500,
        'body': json.dumps({'error': str(e)})
        # Missing headers!
    }
```

**Do this:**
```python
except Exception as e:
    return {
        'statusCode': 500,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'  # ← Added!
        },
        'body': json.dumps({'error': str(e)})
    }
```

### ❌ Mistake 3: Forgetting to Deploy

**Don't do this:**
```bash
# Edit code
git add . && git commit -m "fix" && git push
# Forget to run terraform apply!
```

**Do this:**
```bash
# Edit code
git add . && git commit -m "fix" && git push
cd terraform && terraform apply -auto-approve  # ← Deploy!
```

### ❌ Mistake 4: Testing Wrong URL

**Don't do this:**
```bash
# Test API Gateway directly
curl https://bnwq828189.execute-api.us-east-1.amazonaws.com/prod/chat
```

**Do this:**
```bash
# Test through CloudFront (like the browser does)
curl -H "Origin: https://d2ng4r0rqkdhfd.cloudfront.net" \
  https://bnwq828189.execute-api.us-east-1.amazonaws.com/prod/chat
```

---

## Permanent Prevention Checklist

Before pushing ANY Lambda code changes:

- [ ] All return statements have CORS headers
- [ ] Test locally with `python local_test.py`
- [ ] Run `terraform apply` after code changes
- [ ] Test API with curl
- [ ] Clear browser cache before testing in browser

---

## Emergency Quick Fix

If the app is broken in production:

```bash
# 1. Restore last working version
cd test-llms-demo/backend/chat
git checkout HEAD~1 index.py

# 2. Deploy immediately
cd ../../terraform
terraform apply -auto-approve

# 3. Test
curl -X POST https://bnwq828189.execute-api.us-east-1.amazonaws.com/prod/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}'
```

---

## How to Verify CORS is Working

### Method 1: Check Response Headers

```bash
curl -X POST "https://bnwq828189.execute-api.us-east-1.amazonaws.com/prod/chat" \
  -H "Content-Type: application/json" \
  -H "Origin: https://d2ng4r0rqkdhfd.cloudfront.net" \
  -d '{"question":"test"}' \
  -i | grep -i "access-control"
```

Should see:
```
access-control-allow-origin: *
```

### Method 2: Browser DevTools

1. Open website: https://d2ng4r0rqkdhfd.cloudfront.net
2. Open DevTools (F12) → Network tab
3. Ask a question
4. Click the failed request
5. Check "Response Headers"
6. Should see: `Access-Control-Allow-Origin: *`

If missing → Lambda didn't return CORS headers → Lambda is broken

---

## The Root Problem

**The browser does this:**
```
1. Your website: https://d2ng4r0rqkdhfd.cloudfront.net
2. Tries to call: https://bnwq828189.execute-api.us-east-1.amazonaws.com/prod/chat
3. Different domains! ← CORS check triggered
4. Browser checks response for: Access-Control-Allow-Origin: *
5. If missing → BLOCKS the request
```

**Fix: Lambda MUST return the header in EVERY response!**

---

## Technical Details

### What API Gateway Does

**File: `terraform/api_gateway.tf` lines 17-26:**

```terraform
resource "aws_api_gateway_gateway_response" "cors" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,DELETE,OPTIONS'"
  }
}
```

This ONLY handles:
- ✅ OPTIONS preflight requests
- ✅ API Gateway 4XX errors (before Lambda runs)

This does NOT handle:
- ❌ Lambda responses (200, 500, etc.)
- ❌ Lambda errors

**That's why Lambda MUST return CORS headers!**

---

## Summary

**The Problem:**
Browser blocks cross-origin requests without CORS headers

**The Solution:**
Lambda must return `Access-Control-Allow-Origin: *` in ALL responses

**The Prevention:**
1. Always include CORS headers in every return statement
2. Use `print()` not `logger` in Lambda
3. Deploy with `terraform apply` after code changes
4. Test before pushing

**The Quick Fix:**
```bash
git checkout HEAD~1 backend/chat/index.py
cd terraform && terraform apply -auto-approve
```

---

This error will NEVER haunt us again! 👻❌
