const regression = require('regression');
const db = require('./db');

async function getPredictions() {
  const predictions = {};

  for (const symbol of ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA']) {
    const history = db.get(`prices.${symbol}`).value() || [];

    if (history.length < 10) {
      predictions[symbol] = {
        symbol,
        predictedPrice: null,
        confidence: 0,
        basedOnDays: history.length,
        error: 'Insufficient historical data'
      };
      continue;
    }

    // Prepare data for regression: [[x, y], ...] where x is time index, y is price
    const data = history.map((point, index) => [index, point.price]);

    // Fit linear regression
    const result = regression.linear(data);
    const [slope, intercept] = result.equation;

    // Predict next point (index = history.length)
    const nextIndex = history.length;
    const predictedPrice = slope * nextIndex + intercept;

    // Calculate confidence (R-squared)
    const confidence = Math.min(result.r2 * 100, 100); // As percentage

    predictions[symbol] = {
      symbol,
      predictedPrice: Math.max(predictedPrice, 0), // Ensure non-negative
      confidence: Math.round(confidence),
      basedOnDays: history.length,
      trend: slope > 0 ? 'up' : 'down'
    };
  }

  return predictions;
}

module.exports = { getPredictions };