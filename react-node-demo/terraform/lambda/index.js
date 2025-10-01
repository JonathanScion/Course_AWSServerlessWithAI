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

    const biweeklyPay = hourlyRate * 80 * 0.65;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hourlyRate: parseFloat(hourlyRate),
        biweeklyPay: biweeklyPay.toFixed(2)
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};