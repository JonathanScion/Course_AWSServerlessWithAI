import React, { useState } from 'react';
import './App.css';

function App() {
  const [hourlyRate, setHourlyRate] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/calculate';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hourlyRate }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Contractor Pay Calculator Plus</h1>
        <p>Calculate your bi-weekly pay after taxes (35%)</p>

        <form onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="Enter hourly rate"
              style={{
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                marginRight: '10px',
                width: '200px'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                borderRadius: '5px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Calculating...' : 'Submit'}
            </button>
          </div>
        </form>

        {error && (
          <div style={{ color: '#ff6b6b', marginTop: '20px' }}>
            Error: {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px' }}>
            <h2>Results</h2>
            <p>Hourly Rate: ${result.hourlyRate}</p>
            <p>80 hours (2 weeks)</p>
            <p>After 35% taxes:</p>
            <h3>Bi-weekly Pay: ${result.biweeklyPay}</h3>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
