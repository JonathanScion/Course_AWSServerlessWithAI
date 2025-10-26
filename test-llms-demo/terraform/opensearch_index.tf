# Python script to create the OpenSearch index
resource "local_file" "create_index_script" {
  filename = "${path.module}/scripts/create_opensearch_index.py"
  content  = <<-EOT
import boto3
import json
import time
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth

def create_index():
    # Get AWS credentials
    session = boto3.Session()
    credentials = session.get_credentials()
    region = '${data.aws_region.current.name}'

    # OpenSearch client with AWS auth
    auth = AWSV4SignerAuth(credentials, region, 'aoss')

    # Parse endpoint (remove https://)
    endpoint = '${aws_opensearchserverless_collection.vectors.collection_endpoint}'
    host = endpoint.replace('https://', '')

    client = OpenSearch(
        hosts=[{'host': host, 'port': 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        timeout=300
    )

    # Wait for collection to be ready
    print("Waiting for OpenSearch collection to be ready...")
    time.sleep(60)

    index_name = '${var.opensearch_index_name}'

    # Check if index already exists
    if client.indices.exists(index=index_name):
        print(f"Index {index_name} already exists")
        return

    # Create the index with vector search mappings
    index_body = {
        'settings': {
            'index.knn': True
        },
        'mappings': {
            'properties': {
                'embedding': {
                    'type': 'knn_vector',
                    'dimension': 1536,
                    'method': {
                        'name': 'hnsw',
                        'engine': 'faiss',
                        'parameters': {
                            'ef_construction': 512,
                            'm': 16
                        }
                    }
                },
                'text': {
                    'type': 'text'
                },
                'metadata': {
                    'type': 'text'
                }
            }
        }
    }

    print(f"Creating index: {index_name}")
    response = client.indices.create(index=index_name, body=index_body)
    print(f"Index created successfully: {response}")

if __name__ == '__main__':
    create_index()
EOT
}

# Install required Python package and run the script
resource "null_resource" "create_opensearch_index" {
  triggers = {
    collection_id = aws_opensearchserverless_collection.vectors.id
    index_name    = var.opensearch_index_name
    script_hash   = local_file.create_index_script.content
  }

  provisioner "local-exec" {
    command     = "pip install opensearch-py boto3 --quiet && python ${local_file.create_index_script.filename}"
    working_dir = path.module
  }

  depends_on = [
    local_file.create_index_script,
    aws_opensearchserverless_collection.vectors,
    aws_opensearchserverless_access_policy.data
  ]
}
