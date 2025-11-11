const axios = require('axios');
const db = require('./db');

const COINGECKO_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const CRYPTO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  DOGE: 'dogecoin',
  ADA: 'cardano'
};

async function getPrices() {
  try {
    const ids = Object.values(CRYPTO_IDS).join(',');
    const response = await axios.get(`${COINGECKO_URL}/simple/price`, {
      params: {
        ids,
        vs_currencies: 'usd',
        include_24hr_change: true
      }
    });

    const prices = {};
    for (const [symbol, id] of Object.entries(CRYPTO_IDS)) {
      if (response.data[id]) {
        prices[symbol] = {
          symbol,
          price: response.data[id].usd,
          change24h: response.data[id].usd_24h_change,
          timestamp: new Date()
        };
      }
    }

    // Store in DB
    const now = new Date();
    for (const [symbol, data] of Object.entries(prices)) {
      const currentPrices = db.get(`prices.${symbol}`).value() || [];
      currentPrices.push({
        price: data.price,
        timestamp: now
      });
      // Keep only last 30 days (assuming hourly updates)
      if (currentPrices.length > 720) {
        currentPrices.splice(0, currentPrices.length - 720);
      }
      db.set(`prices.${symbol}`, currentPrices).write();
    }

    return prices;
  } catch (error) {
    throw new Error(`Failed to fetch prices: ${error.message}`);
  }
}

module.exports = { getPrices };