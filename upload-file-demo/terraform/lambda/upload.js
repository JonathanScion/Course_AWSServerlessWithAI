const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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
  console.log('Upload handler event:', JSON.stringify(event, null, 2));

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
    const { fileName, fileSize, contentType, description } = body;

    // Validate input
    if (!fileName || !fileSize || !contentType) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'fileName, fileSize, and contentType are required' })
      };
    }

    // Validate file size (max 100MB)
    if (fileSize > 100 * 1024 * 1024) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File size exceeds 100MB limit' })
      };
    }

    const fileId = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadTimestamp = new Date().toISOString();

    // Generate presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileId,
      ContentType: contentType,
      Metadata: {
        originalFileName: fileName,
        uploadTimestamp: uploadTimestamp
      }
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes

    // Store metadata in DynamoDB
    const metadata = {
      fileId: fileId,
      fileName: fileName,
      fileSize: fileSize,
      contentType: contentType,
      description: description || '',
      uploadTimestamp: uploadTimestamp,
      status: 'pending'
    };

    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: metadata
    }));

    const responseTime = Date.now() - startTime;

    // Log custom metrics
    console.log('MONITORING|UploadRequestInitiated|Count|1');
    console.log(`MONITORING|UploadResponseTime|Milliseconds|${responseTime}`);
    console.log(`MONITORING|FileSize|Bytes|${fileSize}`);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        presignedUrl: presignedUrl,
        fileId: fileId,
        expiresIn: 300
      })
    };

  } catch (error) {
    console.error('Error generating upload URL:', error);

    console.log('MONITORING|UploadError|Count|1');

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to generate upload URL', details: error.message })
    };
  }
};
