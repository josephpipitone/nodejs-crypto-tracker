const regression = require('regression');
const db = require('./db');

async function getPredictions() {
  const predictions = {};

  for (const symbol of ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA']) {
    const history = db.get(`prices.${symbol}`).value() || [];

    if (history.length < 5) {
      // If insufficient data but we have at least some data points, try simple extrapolation
      if (history.length >= 3) {
        // Use linear regression even for small datasets
        const baseTime = new Date(history[0].timestamp).getTime();
        const data = history.map((point) => [(new Date(point.timestamp).getTime() - baseTime) / (4 * 60 * 60 * 1000), point.price]);
        const result = regression.linear(data);
        const [slope] = result.equation;

        const slopeDirection = slope > 0.001 ? 'positive' : slope < -0.001 ? 'negative' : 'neutral';
        const confidence = Math.min(result.r2 * 100, 60); // Cap at 60% for small datasets

        predictions[symbol] = {
          symbol,
          slopeDirection,
          confidence: Math.round(confidence),
          basedOnIntervals: history.length,
          note: 'Based on limited data - confidence may be low'
        };
      } else {
        predictions[symbol] = {
          symbol,
          slopeDirection: null,
          confidence: 0,
          basedOnIntervals: history.length,
          error: 'Insufficient historical data for reliable prediction'
        };
      }
      continue;
    }

    // Prepare data for regression: [[x, y], ...] where x is time in 4-hour units, y is price
    const baseTime = new Date(history[0].timestamp).getTime();
    const data = history.map((point) => [(new Date(point.timestamp).getTime() - baseTime) / (4 * 60 * 60 * 1000), point.price]);

    // Fit linear regression
    const result = regression.linear(data);
    const [slope, intercept] = result.equation;

    // Calculate slope direction
    const slopeDirection = slope > 0 ? 'positive' : slope < 0 ? 'negative' : 'neutral';

    // Calculate confidence (R-squared)
    const confidence = Math.min(result.r2 * 100, 100); // As percentage

    predictions[symbol] = {
      symbol,
      slopeDirection,
      confidence: Math.round(confidence),
      basedOnIntervals: history.length
    };
  }

  return predictions;
}

module.exports = { getPredictions };