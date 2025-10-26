output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.prod.invoke_url
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "frontend_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "documents_bucket_name" {
  description = "S3 bucket name for documents"
  value       = aws_s3_bucket.documents.bucket
}

output "knowledge_base_id" {
  description = "Bedrock Knowledge Base ID"
  value       = aws_bedrockagent_knowledge_base.main.id
}

output "data_source_id" {
  description = "Bedrock Data Source ID"
  value       = aws_bedrockagent_data_source.s3.data_source_id
}

output "opensearch_collection_endpoint" {
  description = "OpenSearch Serverless collection endpoint"
  value       = aws_opensearchserverless_collection.vectors.collection_endpoint
}

output "chat_lambda_name" {
  description = "Chat Lambda function name"
  value       = aws_lambda_function.chat.function_name
}

output "documents_lambda_name" {
  description = "Documents Lambda function name"
  value       = aws_lambda_function.documents.function_name
}

output "website_url" {
  description = "Website URL (CloudFront distribution)"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}
