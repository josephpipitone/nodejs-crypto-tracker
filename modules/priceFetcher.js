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
    await db.read();
    const now = new Date();
    for (const [symbol, data] of Object.entries(prices)) {
      if (!db.data.prices[symbol]) {
        db.data.prices[symbol] = [];
      }
      db.data.prices[symbol].push({
        price: data.price,
        timestamp: now
      });
      // Keep only last 30 days (assuming hourly updates)
      if (db.data.prices[symbol].length > 720) {
        db.data.prices[symbol] = db.data.prices[symbol].slice(-720);
      }
    }
    await db.write();

    return prices;
  } catch (error) {
    throw new Error(`Failed to fetch prices: ${error.message}`);
  }
}

module.exports = { getPrices };