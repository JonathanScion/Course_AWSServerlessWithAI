#!/usr/bin/env python3
"""
Script to create a vector index in OpenSearch Serverless for Bedrock Knowledge Base.

This script must be run after the OpenSearch Serverless collection is created
but before the Bedrock Knowledge Base is created.

Required environment variables:
- OPENSEARCH_ENDPOINT: The OpenSearch Serverless collection endpoint
- OPENSEARCH_INDEX_NAME: Name of the index to create
- AWS_REGION: AWS region where the collection exists

The script uses boto3 to authenticate with AWS credentials from the environment.
"""

import boto3
import json
import sys
import time
import os
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth


def create_index():
    """Create the OpenSearch Serverless vector index."""

    # Get configuration from environment variables
    endpoint = os.environ.get('OPENSEARCH_ENDPOINT')
    index_name = os.environ.get('OPENSEARCH_INDEX_NAME')
    region = os.environ.get('AWS_REGION')

    if not all([endpoint, index_name, region]):
        print("ERROR: Missing required environment variables:")
        print(f"  OPENSEARCH_ENDPOINT: {'✓' if endpoint else '✗'}")
        print(f"  OPENSEARCH_INDEX_NAME: {'✓' if index_name else '✗'}")
        print(f"  AWS_REGION: {'✓' if region else '✗'}")
        sys.exit(1)

    print(f"Creating OpenSearch index: {index_name}")
    print(f"Endpoint: {endpoint}")
    print(f"Region: {region}")

    # Get AWS credentials
    session = boto3.Session()
    credentials = session.get_credentials()

    # OpenSearch client with AWS auth
    auth = AWSV4SignerAuth(credentials, region, 'aoss')

    # Parse endpoint (remove https:// if present)
    host = endpoint.replace('https://', '')

    client = OpenSearch(
        hosts=[{'host': host, 'port': 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        timeout=300
    )

    # Wait for collection to be fully ready
    print("Waiting for OpenSearch collection to be ready (60 seconds)...")
    time.sleep(60)

    # Check if index already exists
    try:
        if client.indices.exists(index=index_name):
            print(f"✓ Index '{index_name}' already exists")
            return
    except Exception as e:
        print(f"Note: Error checking if index exists (collection may still be initializing): {e}")
        print("Continuing with index creation...")

    # Create the index with vector search mappings
    # Using 1536 dimensions for Amazon Titan embeddings
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

    print(f"Creating index with vector search configuration...")
    try:
        response = client.indices.create(index=index_name, body=index_body)
        print(f"✓ Index created successfully!")
        print(f"Response: {json.dumps(response, indent=2)}")
    except Exception as e:
        print(f"✗ Error creating index: {e}")
        sys.exit(1)


if __name__ == '__main__':
    create_index()
