const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { randomUUID } = require('crypto');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cloudwatchClient = new CloudWatchClient({});

// Helper function to send CloudWatch metrics
async function sendMetrics(metricData) {
  try {
    await cloudwatchClient.send(new PutMetricDataCommand({
      Namespace: 'SalaryCalculator',
      MetricData: metricData
    }));
  } catch (error) {
    console.error('Failed to send metrics:', error);
  }
}

exports.handler = async (event) => {
  const startTime = Date.now();

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

    // Metric: Request count
    await sendMetrics([{
      MetricName: 'RequestCount',
      Value: 1,
      Unit: 'Count',
      Timestamp: new Date()
    }]);

    if (!hourlyRate || isNaN(hourlyRate)) {
      // Metric: Validation errors
      await sendMetrics([{
        MetricName: 'ValidationErrors',
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date()
      }]);

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

    const duration = Date.now() - startTime;

    // Send custom metrics to CloudWatch
    await sendMetrics([
      {
        MetricName: 'SuccessfulCalculations',
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date()
      },
      {
        MetricName: 'AverageHourlyRate',
        Value: parseFloat(hourlyRate),
        Unit: 'None',
        Timestamp: new Date()
      },
      {
        MetricName: 'ResponseTime',
        Value: duration,
        Unit: 'Milliseconds',
        Timestamp: new Date()
      }
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error:', error);

    // Metric: Error count
    await sendMetrics([{
      MetricName: 'Errors',
      Value: 1,
      Unit: 'Count',
      Timestamp: new Date()
    }]);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};