# IAM Role for Bedrock Knowledge Base
resource "aws_iam_role" "knowledge_base" {
  name = "${local.project_name}-kb-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name    = "${local.project_name}-kb-role"
    Project = local.project_name
  }
}

# Attach Bedrock full access policy to Knowledge Base role
resource "aws_iam_role_policy_attachment" "knowledge_base_bedrock" {
  role       = aws_iam_role.knowledge_base.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
}

# Policy for Knowledge Base to access S3 documents bucket
resource "aws_iam_role_policy" "knowledge_base_s3" {
  name = "${local.project_name}-kb-s3-policy"
  role = aws_iam_role.knowledge_base.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*"
        ]
      }
    ]
  })
}

# Policy for Knowledge Base to access OpenSearch Serverless
resource "aws_iam_role_policy" "knowledge_base_opensearch" {
  name = "${local.project_name}-kb-opensearch-policy"
  role = aws_iam_role.knowledge_base.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "aoss:APIAccessAll"
        Resource = aws_opensearchserverless_collection.vectors.arn
      }
    ]
  })
}

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda" {
  name = "${local.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name    = "${local.project_name}-lambda-role"
    Project = local.project_name
  }
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Policy for Lambda to access Bedrock
resource "aws_iam_role_policy" "lambda_bedrock" {
  name = "${local.project_name}-lambda-bedrock-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "bedrock:*"
        Resource = "*"
      }
    ]
  })
}

# Policy for Lambda to access S3 documents bucket
resource "aws_iam_role_policy" "lambda_s3" {
  name = "${local.project_name}-lambda-s3-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*"
        ]
      }
    ]
  })
}
