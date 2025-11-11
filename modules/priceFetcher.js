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

// Seed data generator for Vercel deployment
function generateSeedData() {
  const now = new Date();
  const seedData = {};
  
  for (const [symbol, id] of Object.entries(CRYPTO_IDS)) {
    const basePrice = getBasePriceForSymbol(symbol);
    const prices = [];
    
    // Generate 30 days of hourly data
    for (let i = 720; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // i hours ago
      const variance = (Math.random() - 0.5) * 0.1; // ±5% variance
      const price = basePrice * (1 + variance + (Math.sin(i / 100) * 0.02)); // Add some trend
      prices.push({
        price: Math.max(price, basePrice * 0.5), // Ensure not too low
        timestamp
      });
    }
    
    seedData[symbol] = prices;
  }
  
  return seedData;
}

function getBasePriceForSymbol(symbol) {
  const basePrices = {
    BTC: 45000,
    ETH: 2800,
    SOL: 95,
    DOGE: 0.08,
    ADA: 0.45
  };
  return basePrices[symbol] || 1000;
}

function seedDatabase() {
  const seedData = generateSeedData();
  const now = new Date();
  
  for (const [symbol, prices] of Object.entries(seedData)) {
    // Clear existing data and write seed data
    db.set(`prices.${symbol}`, prices).write();
  }
  
  console.log('Database seeded with initial data for Vercel deployment');
}

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

    // Check if we need to seed data for Vercel deployment
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    const firstSymbol = Object.keys(CRYPTO_IDS)[0];
    const hasExistingData = db.get(`prices.${firstSymbol}`).value();
    
    if (isVercel && (!hasExistingData || hasExistingData.length === 0)) {
      console.log('Seeding database with initial data for Vercel deployment');
      seedDatabase();
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

module.exports = { getPrices, seedDatabase };