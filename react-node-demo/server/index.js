const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/calculate', (req, res) => {
  const { hourlyRate } = req.body;

  if (!hourlyRate || isNaN(hourlyRate)) {
    return res.status(400).json({ error: 'Please provide a valid hourly rate' });
  }

  const biweeklyPay = hourlyRate * 80 * 0.65;

  res.json({
    hourlyRate: parseFloat(hourlyRate),
    biweeklyPay: biweeklyPay.toFixed(2)
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});