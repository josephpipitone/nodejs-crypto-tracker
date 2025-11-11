# Node.js Crypto Tracker

A web application that tracks real-time cryptocurrency prices, analyzes sentiment from X (Twitter), and provides price predictions based on historical trends.

## Features

- **Real-time Prices**: Fetches current prices for BTC, ETH, SOL, DOGE, and ADA from CoinGecko API
- **Sentiment Analysis**: Analyzes recent tweets about cryptocurrencies using Twitter API and sentiment analysis
- **Price Prediction**: Uses linear regression on historical price data to predict future prices
- **Web Interface**: Clean, responsive dashboard displaying all data

## Prerequisites

- Node.js (v14 or higher)
- Twitter Developer Account with API v2 access (for sentiment analysis)

## Installation

1. Clone or download the project
2. Run `npm install` to install dependencies
3. Create a Twitter app at https://developer.twitter.com and get your Bearer Token
4. Update `.env` file with your Twitter Bearer Token:
   ```
   TWITTER_BEARER_TOKEN=your_actual_bearer_token_here
   ```

## Usage

1. Start the server: `npm start`
2. Open your browser and go to `http://localhost:3000`
3. The dashboard will load with current prices and predictions
4. Click "Refresh Data" to update all information

## Deployment

### Local Development
1. Copy `.env.example` to `.env`
2. Add your actual Twitter Bearer Token to `.env`
3. Run `npm start`

### Vercel Deployment
1. Connect your GitHub repo to Vercel
2. In Vercel dashboard → Project Settings → Environment Variables, add:
   - `COINGECKO_API_URL`: `https://api.coingecko.com/api/v3`
   - `TWITTER_BEARER_TOKEN`: Your actual Twitter Bearer Token
   - `PORT`: `3000` (optional)
3. Deploy

**Important**: Never commit your `.env` file - it's in `.gitignore` for security.

## API Endpoints

- `GET /api/prices` - Get current cryptocurrency prices
- `GET /api/sentiment` - Get sentiment analysis from Twitter
- `GET /api/predict` - Get price predictions

## Technologies Used

- **Backend**: Node.js, Express.js
- **APIs**: CoinGecko, Twitter API v2
- **Database**: LowDB (JSON-based)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3, Chart.js
- **Libraries**: Axios, Sentiment, Regression

## Notes

- Price data is cached locally for prediction analysis
- Twitter API has rate limits; sentiment analysis may be limited
- Predictions improve with more historical data (run the app regularly to build history)
- Without a valid Twitter Bearer Token, sentiment analysis will show errors but prices and predictions will still work