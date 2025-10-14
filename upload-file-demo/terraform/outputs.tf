output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "${aws_api_gateway_stage.prod.invoke_url}"
}

output "api_key" {
  description = "API Key"
  value       = aws_api_gateway_api_key.main.value
  sensitive   = true
}

output "website_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "files_bucket_name" {
  description = "S3 bucket name for uploaded files"
  value       = aws_s3_bucket.files.bucket
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.files_metadata.name
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "lambda_functions" {
  description = "Lambda function names"
  value = {
    upload   = aws_lambda_function.upload.function_name
    list     = aws_lambda_function.list.function_name
    download = aws_lambda_function.download.function_name
    delete   = aws_lambda_function.delete.function_name
    confirm  = aws_lambda_function.confirm.function_name
  }
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = aws_cloudfront_distribution.website.id
}

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].id : null
}
