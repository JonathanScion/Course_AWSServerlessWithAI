variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "multi-llm-rag"
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 60
}

variable "chat_lambda_memory" {
  description = "Memory size for chat Lambda function in MB"
  type        = number
  default     = 512
}

variable "doc_lambda_memory" {
  description = "Memory size for document Lambda function in MB"
  type        = number
  default     = 256
}

variable "embedding_model_id" {
  description = "Bedrock embedding model ID for knowledge base"
  type        = string
  default     = "amazon.titan-embed-text-v1"
}

variable "opensearch_index_name" {
  description = "Name of the vector index in OpenSearch Serverless"
  type        = string
  default     = "bedrock-knowledge-base-index"
}
