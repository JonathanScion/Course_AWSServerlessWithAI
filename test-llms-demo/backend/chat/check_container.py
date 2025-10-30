"""
Lambda function to inspect the container environment
This shows what's actually running "under the hood"
"""

import json
import os
import platform
import sys

def handler(event, context):
    """Show what the Lambda container looks like"""

    container_info = {
        "container_details": {
            "operating_system": platform.system(),
            "os_release": platform.release(),
            "os_version": platform.version(),
            "architecture": platform.machine(),
            "processor": platform.processor(),
        },
        "python_runtime": {
            "version": sys.version,
            "executable": sys.executable,
            "path": sys.path[:5],  # First 5 paths
        },
        "lambda_environment": {
            "function_name": os.environ.get('AWS_LAMBDA_FUNCTION_NAME'),
            "function_version": os.environ.get('AWS_LAMBDA_FUNCTION_VERSION'),
            "function_memory": os.environ.get('AWS_LAMBDA_FUNCTION_MEMORY_SIZE'),
            "log_group": os.environ.get('AWS_LAMBDA_LOG_GROUP_NAME'),
            "log_stream": os.environ.get('AWS_LAMBDA_LOG_STREAM_NAME'),
            "region": os.environ.get('AWS_REGION'),
        },
        "file_system": {
            "writable_tmp": "/tmp exists" if os.path.exists('/tmp') else "/tmp missing",
            "task_dir": os.listdir('/var/task')[:10],  # Your code location
            "runtime_dir": os.listdir('/var/runtime')[:10] if os.path.exists('/var/runtime') else [],
        },
        "this_is_a_container": True,
        "you_just_dont_manage_it": "That's what 'serverless' means!"
    }

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(container_info, indent=2)
    }
