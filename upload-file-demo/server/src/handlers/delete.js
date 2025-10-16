const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
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
  console.log('Delete handler event:', JSON.stringify(event, null, 2));

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

    const fileId = event.pathParameters?.fileId;

    if (!fileId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'fileId is required' })
      };
    }

    // Check if file exists in DynamoDB
    const result = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { fileId: fileId }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File not found' })
      };
    }

    // Delete from S3
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileId
    }));

    // Delete from DynamoDB
    await ddbDocClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { fileId: fileId }
    }));

    const responseTime = Date.now() - startTime;

    // Log custom metrics
    console.log('MONITORING|DeleteRequest|Count|1');
    console.log(`MONITORING|DeleteResponseTime|Milliseconds|${responseTime}`);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'File deleted successfully',
        fileId: fileId
      })
    };

  } catch (error) {
    console.error('Error deleting file:', error);

    console.log('MONITORING|DeleteError|Count|1');

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete file', details: error.message })
    };
  }
};
