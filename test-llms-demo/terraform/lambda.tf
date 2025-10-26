# Archive the chat Lambda function
data "archive_file" "chat_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/chat"
  output_path = "${path.module}/lambda_packages/chat_function.zip"
}

# Archive the documents Lambda function
data "archive_file" "doc_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/documents"
  output_path = "${path.module}/lambda_packages/doc_function.zip"
}

# Chat Lambda Function
resource "aws_lambda_function" "chat" {
  filename         = data.archive_file.chat_lambda.output_path
  function_name    = "${local.project_name}-chat"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.chat_lambda.output_base64sha256
  runtime          = "python3.11"
  timeout          = var.lambda_timeout
  memory_size      = var.chat_lambda_memory

  environment {
    variables = {
      KNOWLEDGE_BASE_ID = aws_bedrockagent_knowledge_base.main.id
      REGION            = data.aws_region.current.name
    }
  }

  tags = {
    Name    = "${local.project_name}-chat"
    Project = local.project_name
  }
}

# Document Management Lambda Function
resource "aws_lambda_function" "documents" {
  filename         = data.archive_file.doc_lambda.output_path
  function_name    = "${local.project_name}-documents"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.doc_lambda.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = var.doc_lambda_memory

  environment {
    variables = {
      BUCKET_NAME       = aws_s3_bucket.documents.bucket
      KNOWLEDGE_BASE_ID = aws_bedrockagent_knowledge_base.main.id
      DATA_SOURCE_ID    = aws_bedrockagent_data_source.s3.data_source_id
      REGION            = data.aws_region.current.name
    }
  }

  tags = {
    Name    = "${local.project_name}-documents"
    Project = local.project_name
  }
}

# Lambda permissions for API Gateway to invoke chat function
resource "aws_lambda_permission" "chat_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Lambda permissions for API Gateway to invoke documents function
resource "aws_lambda_permission" "documents_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.documents.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
