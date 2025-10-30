"""
Local testing script for Lambda function
Run this to test your Lambda locally with VS Code debugger
"""

import json
import os
import sys

# Set up environment variables (use your actual values)
os.environ['REGION'] = 'us-east-1'
os.environ['KNOWLEDGE_BASE_ID'] = 'CJBBYSINRN'  # From your terraform output
os.environ['AWS_PROFILE'] = 'default'  # Or your AWS profile name

# Import the Lambda handler
from index import handler

# Mock Lambda context
class MockContext:
    def __init__(self):
        self.function_name = "multi-llm-rag-chat"
        self.function_version = "$LATEST"
        self.invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:multi-llm-rag-chat"
        self.memory_limit_in_mb = "512"
        self.request_id = "local-test-request-id"
        self.log_group_name = "/aws/lambda/multi-llm-rag-chat"
        self.log_stream_name = "local-test-stream"
        self.aws_request_id = "local-test-request-id"

    def get_remaining_time_in_millis(self):
        return 300000  # 5 minutes


def test_lambda_locally():
    """Test the Lambda function with a sample event"""

    # Sample API Gateway event
    event = {
        'body': json.dumps({
            'question': 'What is AWS Lambda?'
        }),
        'headers': {
            'Content-Type': 'application/json'
        },
        'httpMethod': 'POST',
        'path': '/chat',
        'requestContext': {
            'requestId': 'test-request-id'
        }
    }

    context = MockContext()

    print("=" * 80)
    print("LOCAL LAMBDA TEST")
    print("=" * 80)
    print(f"Question: {json.loads(event['body'])['question']}")
    print("-" * 80)

    # Call the handler
    response = handler(event, context)

    print("-" * 80)
    print(f"Status Code: {response['statusCode']}")
    print("-" * 80)

    # Pretty print the response
    response_body = json.loads(response['body'])
    print(json.dumps(response_body, indent=2))
    print("=" * 80)

    return response


if __name__ == '__main__':
    # You can set a breakpoint here or inside the handler
    result = test_lambda_locally()

    # Check if successful
    if result['statusCode'] == 200:
        print("\n✅ Test PASSED")
    else:
        print("\n❌ Test FAILED")
        sys.exit(1)
