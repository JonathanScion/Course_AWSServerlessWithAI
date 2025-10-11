# API Key
resource "aws_api_gateway_api_key" "calculator_key" {
  name    = "${var.project_name}-api-key"
  enabled = true
}

# Usage Plan with Rate Limiting
resource "aws_api_gateway_usage_plan" "calculator_plan" {
  name        = "${var.project_name}-usage-plan"
  description = "Usage plan with rate limiting for calculator API"

  throttle_settings {
    rate_limit  = 100  # Requests per second
    burst_limit = 200  # Maximum concurrent requests
  }

  quota_settings {
    limit  = 10000 # Total requests per day
    period = "DAY"
  }

  api_stages {
    api_id = aws_api_gateway_rest_api.api.id
    stage  = aws_api_gateway_stage.prod.stage_name
  }
}

# Link API Key to Usage Plan
resource "aws_api_gateway_usage_plan_key" "main" {
  key_id        = aws_api_gateway_api_key.calculator_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.calculator_plan.id
}

# Update API Gateway method to require API key
resource "aws_api_gateway_method" "calculate_post_secured" {
  rest_api_id      = aws_api_gateway_rest_api.api.id
  resource_id      = aws_api_gateway_resource.calculate_resource.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true

  lifecycle {
    create_before_destroy = true
  }
}
