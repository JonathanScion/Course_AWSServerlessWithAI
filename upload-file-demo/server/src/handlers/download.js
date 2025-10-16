const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
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
  console.log('Download handler event:', JSON.stringify(event, null, 2));

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

    // Get metadata from DynamoDB
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

    // Generate presigned URL for download
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileId,
      ResponseContentDisposition: `attachment; filename="${result.Item.fileName}"`
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes

    const responseTime = Date.now() - startTime;

    // Log custom metrics
    console.log('MONITORING|DownloadRequest|Count|1');
    console.log(`MONITORING|DownloadResponseTime|Milliseconds|${responseTime}`);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        presignedUrl: presignedUrl,
        fileName: result.Item.fileName,
        expiresIn: 300
      })
    };

  } catch (error) {
    console.error('Error generating download URL:', error);

    console.log('MONITORING|DownloadError|Count|1');

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to generate download URL', details: error.message })
    };
  }
};
