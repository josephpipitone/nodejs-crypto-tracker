require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

async function testTwitterToken() {
  try {
    console.log('Testing Twitter Bearer Token...');

    // Test 1: Try a different user lookup
    console.log('\n📋 Test 1: User lookup with @elonmusk');
    const user = await twitterClient.v2.userByUsername('elonmusk');

    if (user.data) {
      console.log('✅ User lookup successful:', {
        id: user.data.id,
        username: user.data.username,
        name: user.data.name
      });
    }

    // Test 2: Try a tweet search (similar to what sentiment analyzer does)
    console.log('\n📋 Test 2: Tweet search for "bitcoin"');
    const tweets = await twitterClient.v2.search('bitcoin', {
      max_results: 5,
      'tweet.fields': ['created_at', 'text']
    });

    console.log('✅ Tweet search successful!');
    console.log(`Found ${tweets.data?.length || 0} tweets`);

    if (tweets.data && tweets.data.length > 0) {
      console.log('Sample tweet:', tweets.data[0].text.substring(0, 100) + '...');
    }

  } catch (error) {
    console.log('❌ ERROR: Token validation failed');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);

    if (error.code === 401) {
      console.log('🔍 This is an authentication error. Possible issues:');
      console.log('  - Invalid or expired Bearer Token');
      console.log('  - Token copied incorrectly');
      console.log('  - Twitter app permissions not set correctly');
      console.log('  - Check your .env file for TWITTER_BEARER_TOKEN');
    } else if (error.code === 403) {
      console.log('🔍 Forbidden error - your app might not have the right permissions');
    } else {
      console.log('🔍 Other error - check Twitter API status or rate limits');
    }
  }
}

// Run the test
testTwitterToken();