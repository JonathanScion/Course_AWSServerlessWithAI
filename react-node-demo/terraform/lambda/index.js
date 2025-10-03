const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { hourlyRate } = body;

    if (!hourlyRate || isNaN(hourlyRate)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Please provide a valid hourly rate' })
      };
    }

    const hoursPerWeek = 80;
    const taxRate = 0.35;
    const grossPay = hourlyRate * hoursPerWeek;
    const taxAmount = grossPay * taxRate;
    const biweeklyPay = grossPay - taxAmount;

    const response = {
      hourlyRate: parseFloat(hourlyRate),
      biweeklyPay: biweeklyPay.toFixed(2),
      grossPay: grossPay.toFixed(2),
      taxAmount: taxAmount.toFixed(2)
    };

    // Log to DynamoDB
    const logEntry = {
      id: randomUUID(),
      timestamp: Date.now(),
      hourlyRate: parseFloat(hourlyRate),
      hoursPerWeek,
      grossPay: parseFloat(grossPay.toFixed(2)),
      netPay: parseFloat(biweeklyPay.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      ipAddress: event.requestContext?.identity?.sourceIp || 'unknown',
      userAgent: event.requestContext?.identity?.userAgent || 'unknown'
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: logEntry
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};