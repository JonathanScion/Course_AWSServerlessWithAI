# Bedrock Knowledge Base
resource "aws_bedrockagent_knowledge_base" "main" {
  name     = local.knowledge_base_name
  role_arn = aws_iam_role.knowledge_base.arn

  description = "Knowledge base for multi-LLM RAG chatbot"

  knowledge_base_configuration {
    type = "VECTOR"
    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:${data.aws_region.current.name}::foundation-model/${var.embedding_model_id}"
    }
  }

  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"
    opensearch_serverless_configuration {
      collection_arn    = aws_opensearchserverless_collection.vectors.arn
      vector_index_name = var.opensearch_index_name
      field_mapping {
        vector_field   = "embedding"
        text_field     = "text"
        metadata_field = "metadata"
      }
    }
  }

  depends_on = [
    aws_opensearchserverless_collection.vectors,
    aws_opensearchserverless_access_policy.data,
    aws_iam_role_policy.knowledge_base_s3,
    aws_iam_role_policy.knowledge_base_opensearch
  ]

  tags = {
    Name    = local.knowledge_base_name
    Project = local.project_name
  }
}

# Bedrock Data Source - S3
resource "aws_bedrockagent_data_source" "s3" {
  name              = "S3DocumentSource"
  knowledge_base_id = aws_bedrockagent_knowledge_base.main.id

  data_source_configuration {
    type = "S3"
    s3_configuration {
      bucket_arn = aws_s3_bucket.documents.arn
    }
  }

  tags = {
    Name    = "${local.project_name}-data-source"
    Project = local.project_name
  }
}
