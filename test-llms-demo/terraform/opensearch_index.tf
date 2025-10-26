# Create the OpenSearch Serverless vector index
# This must happen after the collection is created but before the Knowledge Base
resource "null_resource" "create_opensearch_index" {
  triggers = {
    collection_endpoint = aws_opensearchserverless_collection.vectors.collection_endpoint
    index_name          = var.opensearch_index_name
  }

  provisioner "local-exec" {
    command = "pip install opensearch-py boto3 --quiet && python scripts/create_opensearch_index.py"

    environment = {
      OPENSEARCH_ENDPOINT    = aws_opensearchserverless_collection.vectors.collection_endpoint
      OPENSEARCH_INDEX_NAME  = var.opensearch_index_name
      AWS_REGION             = data.aws_region.current.name
    }

    working_dir = path.module
  }

  depends_on = [
    aws_opensearchserverless_collection.vectors,
    aws_opensearchserverless_access_policy.data
  ]
}
