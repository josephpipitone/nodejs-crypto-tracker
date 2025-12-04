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
    
    // Generate 30 days of 4-hour interval data (180 points)
    for (let i = 720; i >= 0; i -= 4) {
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

async function fetchHistoricalData(symbol, days = 30) {
  const id = CRYPTO_IDS[symbol];
  try {
    const response = await axios.get(`${COINGECKO_URL}/coins/${id}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days,
        interval: 'hourly'
      }
    });

    return response.data.prices.map(([timestamp, price]) => ({
      price,
      timestamp: new Date(timestamp)
    }));
  } catch (error) {
    console.error(`Failed to fetch historical data for ${symbol}:`, error.message);
    return [];
  }
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

    // Fetch historical data for symbols with insufficient data
    for (const symbol of Object.keys(CRYPTO_IDS)) {
      const currentPrices = db.get(`prices.${symbol}`).value() || [];
      if (currentPrices.length < 5) {
        console.log(`Fetching historical data for ${symbol}...`);
        const historicalData = await fetchHistoricalData(symbol);
        if (historicalData.length > 0) {
          // Merge with existing data, avoiding duplicates
          const existingTimestamps = new Set(currentPrices.map(p => p.timestamp.getTime()));
          const newData = historicalData.filter(p => !existingTimestamps.has(p.timestamp.getTime()));
          const mergedData = [...currentPrices, ...newData].sort((a, b) => a.timestamp - b.timestamp);

          // Keep only last 180 points
          const finalData = mergedData.slice(-180);
          db.set(`prices.${symbol}`, finalData).write();
        }
      }
    }

    // Store in DB (4-hour intervals)
    const now = new Date();
    for (const [symbol, data] of Object.entries(prices)) {
      const currentPrices = db.get(`prices.${symbol}`).value() || [];
      const lastStored = currentPrices.length > 0 ? new Date(currentPrices[currentPrices.length - 1].timestamp) : null;

      // Only store if it's been at least 4 hours since last storage or no data exists
      if (!lastStored || (now - lastStored) >= 4 * 60 * 60 * 1000) {
        currentPrices.push({
          price: data.price,
          timestamp: now
        });
        // Keep only last 30 days (assuming 4-hour updates: 30*24/4 = 180 points)
        if (currentPrices.length > 180) {
          currentPrices.splice(0, currentPrices.length - 180);
        }
        db.set(`prices.${symbol}`, currentPrices).write();
      }
    }

    return prices;
  } catch (error) {
    throw new Error(`Failed to fetch prices: ${error.message}`);
  }
}

module.exports = { getPrices, seedDatabase };