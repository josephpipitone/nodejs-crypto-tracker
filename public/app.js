const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA'];
let prices = {};
let sentiment = {};
let predictions = {};

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('refreshBtn').addEventListener('click', loadData);

    // Dark mode toggle
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';

    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeButton(currentTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
    });

    function updateThemeButton(theme) {
        const button = document.getElementById('themeToggle');
        if (theme === 'dark') {
            button.textContent = '☀️ Light Mode';
        } else {
            button.textContent = '🌙 Dark Mode';
        }
    }
});

async function loadData() {
    showLoading(true);
    try {
        const [pricesData, sentimentData, predictionsData] = await Promise.all([
            fetch('/api/prices').then(r => r.json()),
            fetch('/api/sentiment').then(r => r.json()),
            fetch('/api/predict').then(r => r.json())
        ]);

        prices = pricesData;
        sentiment = sentimentData;
        predictions = predictionsData;

        renderCryptoCards();
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data. Please try again.');
    } finally {
        showLoading(false);
    }
}

function renderCryptoCards() {
    const container = document.getElementById('cryptoContainer');
    container.innerHTML = '';

    cryptoSymbols.forEach(symbol => {
        const priceData = prices[symbol];
        const sentimentData = sentiment[symbol];
        const predictionData = predictions[symbol];

        const card = createCryptoCard(symbol, priceData, sentimentData, predictionData);
        container.appendChild(card);
    });
}

function createCryptoCard(symbol, priceData, sentimentData, predictionData) {
    const card = document.createElement('div');
    card.className = 'crypto-card';

    const header = document.createElement('div');
    header.className = 'crypto-header';

    const symbolEl = document.createElement('div');
    symbolEl.className = 'crypto-symbol';
    symbolEl.textContent = symbol;

    const priceEl = document.createElement('div');
    priceEl.className = 'crypto-price';
    if (priceData) {
        priceEl.textContent = `$${priceData.price.toFixed(2)}`;
        const changeEl = document.createElement('div');
        changeEl.className = `price-change ${priceData.change24h >= 0 ? 'positive' : 'negative'}`;
        changeEl.textContent = `${priceData.change24h >= 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%`;
        priceEl.appendChild(changeEl);
    } else {
        priceEl.textContent = 'N/A';
    }

    header.appendChild(symbolEl);
    header.appendChild(priceEl);

    card.appendChild(header);

    // Sentiment section
    if (sentimentData) {
        const sentimentSection = document.createElement('div');
        sentimentSection.className = 'sentiment-section';

        const sentimentLabel = document.createElement('div');
        sentimentLabel.textContent = `Sentiment: ${sentimentData.averageSentiment.toFixed(2)} (${sentimentData.tweetCount} tweets)`;

        const sentimentBar = document.createElement('div');
        sentimentBar.className = 'sentiment-bar';

        const sentimentFill = document.createElement('div');
        sentimentFill.className = 'sentiment-fill';
        const sentimentScore = Math.max(-1, Math.min(1, sentimentData.averageSentiment));
        const width = Math.abs(sentimentScore) * 50 + 50; // 50-100%
        sentimentFill.style.width = `${width}%`;

        if (sentimentScore > 0.1) {
            sentimentFill.classList.add('positive');
        } else if (sentimentScore < -0.1) {
            sentimentFill.classList.add('negative');
        } else {
            sentimentFill.classList.add('neutral');
        }

        sentimentBar.appendChild(sentimentFill);
        sentimentSection.appendChild(sentimentLabel);
        sentimentSection.appendChild(sentimentBar);

        card.appendChild(sentimentSection);
    }

    // Prediction section
    if (predictionData && !predictionData.error) {
        const predictionSection = document.createElement('div');
        predictionSection.className = 'prediction-section';

        const predictedPriceEl = document.createElement('div');
        predictedPriceEl.className = 'predicted-price';
        predictedPriceEl.textContent = `Predicted: $${predictionData.predictedPrice.toFixed(2)}`;

        const confidenceEl = document.createElement('div');
        confidenceEl.className = 'confidence';
        confidenceEl.textContent = `Confidence: ${predictionData.confidence}% (${predictionData.basedOnDays} data points)`;

        predictionSection.appendChild(predictedPriceEl);
        predictionSection.appendChild(confidenceEl);

        card.appendChild(predictionSection);
    } else if (predictionData && predictionData.error) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error';
        errorEl.textContent = predictionData.error;
        card.appendChild(errorEl);
    }

    return card;
}

function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = show ? 'block' : 'none';
}

function showError(message) {
    const container = document.getElementById('cryptoContainer');
    container.innerHTML = `<div class="error">${message}</div>`;
}