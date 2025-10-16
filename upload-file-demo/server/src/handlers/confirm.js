const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const AWSXRay = require('aws-xray-sdk-core');

// Wrap AWS SDK clients with X-Ray
const s3Client = AWSXRay.captureAWSv3Client(new S3Client({}));
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const BUCKET_NAME = process.env.BUCKET_NAME;
const TABLE_NAME = process.env.TABLE_NAME;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE'
};

exports.handler = async (event) => {
  console.log('Confirm handler event:', JSON.stringify(event, null, 2));

  const startTime = Date.now();

  try {
    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
      };
    }

    const body = JSON.parse(event.body);
    const { fileId } = body;

    if (!fileId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'fileId is required' })
      };
    }

    // Check if file exists in DynamoDB
    const getResult = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { fileId: fileId }
    }));

    if (!getResult.Item) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File metadata not found' })
      };
    }

    // Verify file exists in S3
    try {
      const headResult = await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileId
      }));

      // Get actual file size from S3
      const actualFileSize = headResult.ContentLength;

      // Update status to completed and set actual file size
      await ddbDocClient.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { fileId: fileId },
        UpdateExpression: 'SET #status = :completed, actualFileSize = :size, completedTimestamp = :timestamp',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':completed': 'completed',
          ':size': actualFileSize,
          ':timestamp': new Date().toISOString()
        }
      }));

      const responseTime = Date.now() - startTime;

      // Log custom metrics
      console.log('MONITORING|UploadConfirmed|Count|1');
      console.log(`MONITORING|ConfirmResponseTime|Milliseconds|${responseTime}`);
      console.log(`MONITORING|ActualFileSize|Bytes|${actualFileSize}`);

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Upload confirmed successfully',
          fileId: fileId,
          actualFileSize: actualFileSize
        })
      };

    } catch (s3Error) {
      // File not found in S3
      console.error('File not found in S3:', s3Error);

      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File not uploaded to S3' })
      };
    }

  } catch (error) {
    console.error('Error confirming upload:', error);

    console.log('MONITORING|ConfirmError|Count|1');

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to confirm upload', details: error.message })
    };
  }
};
