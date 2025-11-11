require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/api/prices', async (req, res) => {
  try {
    const prices = await require('./modules/priceFetcher').getPrices();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sentiment', async (req, res) => {
  try {
    const sentiment = await require('./modules/sentimentAnalyzer').getSentiment();
    res.json(sentiment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/predict', async (req, res) => {
  try {
    const predictions = await require('./modules/predictor').getPredictions();
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});