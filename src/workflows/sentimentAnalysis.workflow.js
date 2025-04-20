const { proxyActivities } = require('@temporalio/workflow');

const activities = proxyActivities({
  startToCloseTimeout: '10 minutes',
  activities: {
    storeProductInDB: () => '',
    scrapeReviews: () => '',
    analyzeSentiment: () => '',
    calculateAndStoreScore: () => '',
  },
  // retry: {
  //   initialInterval: '1 second',
  //   maximumInterval: '1 minute',
  //   backoffCoefficient: 2,
  //   maximumAttempts: 5
  // },
});

async function productSentimentWorkflow(productName) {
  try {
    const productUUID = await activities.storeProductInDB(productName);
    console.log('Product UUID:', productUUID);
    // Activity 1: Scrape reviews
    const reviews = await activities.scrapeReviews(productName);
    
    // Activity 2: Analyze sentiment for each review
    const sentimentResults = await Promise.all(
      reviews.map(review => activities.analyzeSentiment(review))
    );
    
    // Activity 3: Calculate average and store in Redis
    const result = await activities.calculateAndStoreScore(productUUID, sentimentResults);
    
    return result;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  productSentimentWorkflow
};