const { TwitterApi } = require('twitter-api-v2');
const Sentiment = require('sentiment');

const sentiment = new Sentiment();
const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

// Cache for sentiment data to avoid hitting rate limits
let sentimentCache = {};
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

console.log('Twitter Bearer Token loaded:', process.env.TWITTER_BEARER_TOKEN ? 'YES' : 'NO');
console.log('Token starts with:', process.env.TWITTER_BEARER_TOKEN?.substring(0, 10));

const CRYPTO_KEYWORDS = {
  BTC: ['#bitcoin', 'bitcoin', '#btc'],
  ETH: ['#ethereum', 'ethereum', '#eth'],
  SOL: ['#solana', 'solana', '#sol'],
  DOGE: ['#dogecoin', 'dogecoin', '#doge'],
  ADA: ['#cardano', 'cardano', '#ada']
};

async function getSentiment() {
  const now = Date.now();

  // Return cached data if it's still fresh
  if (sentimentCache && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('Returning cached sentiment data');
    return sentimentCache;
  }

  console.log('Fetching fresh sentiment data from Twitter...');
  const results = {};

  for (const [symbol, keywords] of Object.entries(CRYPTO_KEYWORDS)) {
    try {
      // Search for recent tweets - simplified query for free tier
      const query = keywords[0] + ' -is:retweet'; // Use just the first keyword
      const tweets = await twitterClient.v2.search(query, {
        max_results: 5, // Reduce to 5 for free tier
        'tweet.fields': ['created_at', 'text']
        // Removed start_time as it may not be available in free tier
      });

      let totalScore = 0;
      let count = 0;

      if (tweets.data) {
        for (const tweet of tweets.data) {
          const analysis = sentiment.analyze(tweet.text);
          totalScore += analysis.score;
          count++;
        }
      }

      results[symbol] = {
        symbol,
        averageSentiment: count > 0 ? totalScore / count : 0,
        tweetCount: count,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Error fetching sentiment for ${symbol}:`, error.message);
      results[symbol] = {
        symbol,
        averageSentiment: 0,
        tweetCount: 0,
        lastUpdated: new Date(),
        error: error.message
      };
    }

    // Add small delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Cache the results
  sentimentCache = results;
  lastFetchTime = now;

  return results;
}

module.exports = { getSentiment };