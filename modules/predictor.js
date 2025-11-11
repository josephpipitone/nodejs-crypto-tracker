const regression = require('regression');
const db = require('./db');

async function getPredictions() {
  const predictions = {};

  for (const symbol of ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA']) {
    const history = db.get(`prices.${symbol}`).value() || [];

    if (history.length < 10) {
      // If insufficient data but we have at least some data points, try simple extrapolation
      if (history.length >= 3) {
        const prices = history.map(point => point.price);
        const timestamps = history.map((_, index) => index);
        
        // Simple linear extrapolation for minimal datasets
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const trend = prices.length > 1 ?
          (prices[prices.length - 1] - prices[0]) / (prices.length - 1) : 0;
        const predictedPrice = avgPrice + trend * (history.length);
        
        predictions[symbol] = {
          symbol,
          predictedPrice: Math.max(predictedPrice, 0),
          confidence: Math.min(history.length * 10, 50), // Low confidence for small datasets
          basedOnDays: history.length,
          trend: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
          note: 'Based on limited data - confidence may be low'
        };
      } else {
        predictions[symbol] = {
          symbol,
          predictedPrice: null,
          confidence: 0,
          basedOnDays: history.length,
          error: 'Insufficient historical data for reliable prediction'
        };
      }
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