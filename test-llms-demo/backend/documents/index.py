import json
import os
import boto3
import base64
from datetime import datetime
import traceback

s3_client = boto3.client('s3')
bedrock_agent = boto3.client('bedrock-agent', region_name=os.environ['REGION'])

BUCKET_NAME = os.environ['BUCKET_NAME']
KNOWLEDGE_BASE_ID = os.environ['KNOWLEDGE_BASE_ID']
DATA_SOURCE_ID = os.environ['DATA_SOURCE_ID']

def handler(event, context):
    """Lambda handler for document management"""
    try:
        http_method = event['httpMethod']
        path = event['path']

        # Handle CORS preflight
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Allow-Methods': '*'
                },
                'body': ''
            }

        # List documents
        if http_method == 'GET' and path == '/documents':
            return list_documents()

        # Upload document
        elif http_method == 'POST' and path == '/documents':
            return upload_document(event)

        # Delete document
        elif http_method == 'DELETE' and '/documents/' in path:
            document_key = event['pathParameters']['id']
            return delete_document(document_key)

        # Sync knowledge base
        elif http_method == 'POST' and path == '/sync':
            return sync_knowledge_base()

        else:
            return {
                'statusCode': 404,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Not found'})
            }

    except Exception as e:
        print(f"Handler error: {str(e)}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def list_documents():
    """List all documents in the S3 bucket"""
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)

        documents = []
        if 'Contents' in response:
            for obj in response['Contents']:
                documents.append({
                    'id': obj['Key'],
                    'name': obj['Key'],
                    'size': obj['Size'],
                    'lastModified': obj['LastModified'].isoformat(),
                    'url': f"https://{BUCKET_NAME}.s3.amazonaws.com/{obj['Key']}"
                })

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'documents': documents})
        }

    except Exception as e:
        print(f"Error listing documents: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def upload_document(event):
    """Upload a document to S3 and trigger knowledge base sync"""
    try:
        body = json.loads(event['body'])

        # Get file data
        file_name = body.get('fileName')
        file_content = body.get('fileContent')  # Base64 encoded
        content_type = body.get('contentType', 'application/octet-stream')

        if not file_name or not file_content:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'fileName and fileContent are required'})
            }

        # Decode base64 content
        file_data = base64.b64decode(file_content)

        # Generate unique file key
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_key = f"{timestamp}_{file_name}"

        # Upload to S3
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=file_key,
            Body=file_data,
            ContentType=content_type
        )

        print(f"Uploaded file: {file_key}")

        # Trigger knowledge base sync
        try:
            sync_response = bedrock_agent.start_ingestion_job(
                knowledgeBaseId=KNOWLEDGE_BASE_ID,
                dataSourceId=DATA_SOURCE_ID
            )
            print(f"Started ingestion job: {sync_response['ingestionJob']['ingestionJobId']}")
        except Exception as sync_error:
            print(f"Warning: Could not trigger sync: {str(sync_error)}")
            # Don't fail the upload if sync fails

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'File uploaded successfully',
                'fileName': file_key,
                'url': f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_key}"
            })
        }

    except Exception as e:
        print(f"Error uploading document: {str(e)}")
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def delete_document(document_key):
    """Delete a document from S3 and trigger knowledge base sync"""
    try:
        # Delete from S3
        s3_client.delete_object(
            Bucket=BUCKET_NAME,
            Key=document_key
        )

        print(f"Deleted file: {document_key}")

        # Trigger knowledge base sync
        try:
            sync_response = bedrock_agent.start_ingestion_job(
                knowledgeBaseId=KNOWLEDGE_BASE_ID,
                dataSourceId=DATA_SOURCE_ID
            )
            print(f"Started ingestion job: {sync_response['ingestionJob']['ingestionJobId']}")
        except Exception as sync_error:
            print(f"Warning: Could not trigger sync: {str(sync_error)}")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'File deleted successfully',
                'fileName': document_key
            })
        }

    except Exception as e:
        print(f"Error deleting document: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

def sync_knowledge_base():
    """Manually trigger knowledge base sync"""
    try:
        response = bedrock_agent.start_ingestion_job(
            knowledgeBaseId=KNOWLEDGE_BASE_ID,
            dataSourceId=DATA_SOURCE_ID
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Knowledge base sync started',
                'jobId': response['ingestionJob']['ingestionJobId']
            })
        }

    except Exception as e:
        print(f"Error syncing knowledge base: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
