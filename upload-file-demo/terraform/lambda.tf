# Install Lambda dependencies
resource "null_resource" "lambda_dependencies" {
  triggers = {
    package_json = filemd5("${path.module}/lambda/package.json")
  }

  provisioner "local-exec" {
    command     = "npm install --production"
    working_dir = "${path.module}/lambda"
  }
}

# Create Lambda deployment packages
data "archive_file" "upload_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/.terraform/lambda-upload.zip"
  excludes    = ["*.zip"]

  depends_on = [null_resource.lambda_dependencies]
}

data "archive_file" "list_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/.terraform/lambda-list.zip"
  excludes    = ["*.zip"]

  depends_on = [null_resource.lambda_dependencies]
}

data "archive_file" "download_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/.terraform/lambda-download.zip"
  excludes    = ["*.zip"]

  depends_on = [null_resource.lambda_dependencies]
}

data "archive_file" "delete_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/.terraform/lambda-delete.zip"
  excludes    = ["*.zip"]

  depends_on = [null_resource.lambda_dependencies]
}

data "archive_file" "confirm_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/.terraform/lambda-confirm.zip"
  excludes    = ["*.zip"]

  depends_on = [null_resource.lambda_dependencies]
}

# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# Attach basic execution role
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# IAM Policy for Lambda to access S3 and DynamoDB
resource "aws_iam_role_policy" "lambda_permissions" {
  name = "${var.project_name}-lambda-permissions"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:HeadObject"
        ]
        Resource = "${aws_s3_bucket.files.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = aws_dynamodb_table.files_metadata.arn
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# Upload Lambda Function
resource "aws_lambda_function" "upload" {
  filename         = data.archive_file.upload_lambda.output_path
  function_name    = "${var.project_name}-upload"
  role            = aws_iam_role.lambda_role.arn
  handler         = "upload.handler"
  source_code_hash = data.archive_file.upload_lambda.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      BUCKET_NAME    = aws_s3_bucket.files.bucket
      TABLE_NAME     = aws_dynamodb_table.files_metadata.name
      ALLOWED_ORIGIN = "https://${aws_cloudfront_distribution.website.domain_name}"
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-upload"
    }
  )
}

# List Lambda Function
resource "aws_lambda_function" "list" {
  filename         = data.archive_file.list_lambda.output_path
  function_name    = "${var.project_name}-list"
  role            = aws_iam_role.lambda_role.arn
  handler         = "list.handler"
  source_code_hash = data.archive_file.list_lambda.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      TABLE_NAME     = aws_dynamodb_table.files_metadata.name
      ALLOWED_ORIGIN = "https://${aws_cloudfront_distribution.website.domain_name}"
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-list"
    }
  )
}

# Download Lambda Function
resource "aws_lambda_function" "download" {
  filename         = data.archive_file.download_lambda.output_path
  function_name    = "${var.project_name}-download"
  role            = aws_iam_role.lambda_role.arn
  handler         = "download.handler"
  source_code_hash = data.archive_file.download_lambda.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      BUCKET_NAME    = aws_s3_bucket.files.bucket
      TABLE_NAME     = aws_dynamodb_table.files_metadata.name
      ALLOWED_ORIGIN = "https://${aws_cloudfront_distribution.website.domain_name}"
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-download"
    }
  )
}

# Delete Lambda Function
resource "aws_lambda_function" "delete" {
  filename         = data.archive_file.delete_lambda.output_path
  function_name    = "${var.project_name}-delete"
  role            = aws_iam_role.lambda_role.arn
  handler         = "delete.handler"
  source_code_hash = data.archive_file.delete_lambda.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      BUCKET_NAME    = aws_s3_bucket.files.bucket
      TABLE_NAME     = aws_dynamodb_table.files_metadata.name
      ALLOWED_ORIGIN = "https://${aws_cloudfront_distribution.website.domain_name}"
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-delete"
    }
  )
}

# Confirm Lambda Function
resource "aws_lambda_function" "confirm" {
  filename         = data.archive_file.confirm_lambda.output_path
  function_name    = "${var.project_name}-confirm"
  role            = aws_iam_role.lambda_role.arn
  handler         = "confirm.handler"
  source_code_hash = data.archive_file.confirm_lambda.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      BUCKET_NAME    = aws_s3_bucket.files.bucket
      TABLE_NAME     = aws_dynamodb_table.files_metadata.name
      ALLOWED_ORIGIN = "https://${aws_cloudfront_distribution.website.domain_name}"
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-confirm"
    }
  )
}

# Lambda Permissions for API Gateway
resource "aws_lambda_permission" "upload" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "list" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.list.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "download" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.download.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "delete" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "confirm" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.confirm.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

# Lambda Aliases for Canary Deployments
resource "aws_lambda_alias" "upload_live" {
  name             = "live"
  description      = "Live alias for canary deployment"
  function_name    = aws_lambda_function.upload.arn
  function_version = aws_lambda_function.upload.version
}

resource "aws_lambda_alias" "list_live" {
  name             = "live"
  description      = "Live alias for canary deployment"
  function_name    = aws_lambda_function.list.arn
  function_version = aws_lambda_function.list.version
}

resource "aws_lambda_alias" "download_live" {
  name             = "live"
  description      = "Live alias for canary deployment"
  function_name    = aws_lambda_function.download.arn
  function_version = aws_lambda_function.download.version
}

resource "aws_lambda_alias" "delete_live" {
  name             = "live"
  description      = "Live alias for canary deployment"
  function_name    = aws_lambda_function.delete.arn
  function_version = aws_lambda_function.delete.version
}

resource "aws_lambda_alias" "confirm_live" {
  name             = "live"
  description      = "Live alias for canary deployment"
  function_name    = aws_lambda_function.confirm.arn
  function_version = aws_lambda_function.confirm.version
}
