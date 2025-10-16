const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const AWSXRay = require('aws-xray-sdk-core');

// Wrap AWS SDK clients with X-Ray
const ddbClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.TABLE_NAME;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE'
};

exports.handler = async (event) => {
  console.log('List handler event:', JSON.stringify(event, null, 2));

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

    // Scan DynamoDB table for all files
    const result = await ddbDocClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#status = :completed',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':completed': 'completed'
      }
    }));

    // Sort by upload timestamp (newest first)
    const files = (result.Items || []).sort((a, b) =>
      new Date(b.uploadTimestamp) - new Date(a.uploadTimestamp)
    );

    const responseTime = Date.now() - startTime;

    // Log custom metrics
    console.log('MONITORING|ListFilesRequest|Count|1');
    console.log(`MONITORING|ListResponseTime|Milliseconds|${responseTime}`);
    console.log(`MONITORING|FilesCount|Count|${files.length}`);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: files })
    };

  } catch (error) {
    console.error('Error listing files:', error);

    console.log('MONITORING|ListFilesError|Count|1');

    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to list files', details: error.message })
    };
  }
};
