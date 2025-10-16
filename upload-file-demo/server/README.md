# File Upload Server

Backend Lambda functions for the file upload application.

## Structure

```
server/
├── src/
│   └── handlers/      # Lambda function handlers
│       ├── upload.js     # Generate presigned URL for upload
│       ├── confirm.js    # Confirm upload completion
│       ├── list.js       # List all files
│       ├── download.js   # Generate presigned URL for download
│       └── delete.js     # Delete file from S3 and DynamoDB
├── package.json       # Node.js dependencies
└── README.md         # This file
```

## Lambda Functions

### upload.js
- **Endpoint**: POST /files/upload
- **Purpose**: Generate presigned S3 URL for file upload
- **Creates**: Metadata entry in DynamoDB with status "pending"

### confirm.js
- **Endpoint**: POST /files/confirm
- **Purpose**: Verify file was uploaded and update status to "completed"
- **Updates**: DynamoDB metadata with actual file size

### list.js
- **Endpoint**: GET /files
- **Purpose**: List all successfully uploaded files
- **Returns**: Files sorted by upload timestamp (newest first)

### download.js
- **Endpoint**: GET /files/{fileId}/download
- **Purpose**: Generate presigned S3 URL for file download
- **Returns**: Presigned URL valid for 5 minutes

### delete.js
- **Endpoint**: DELETE /files/{fileId}
- **Purpose**: Delete file from S3 and DynamoDB
- **Removes**: Both S3 object and DynamoDB metadata

## Dependencies

All Lambda functions use:
- **@aws-sdk/client-s3**: S3 operations and presigned URLs
- **@aws-sdk/client-dynamodb**: DynamoDB client
- **@aws-sdk/lib-dynamodb**: DynamoDB Document Client
- **@aws-sdk/s3-request-presigner**: Generate presigned URLs
- **aws-xray-sdk-core**: X-Ray tracing for observability

## Development

Install dependencies:
```bash
npm install
```

## Deployment

These functions are deployed via Terraform. See `../terraform/` for infrastructure configuration.
