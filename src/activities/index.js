require('dotenv').config();

const { post } = require('axios');
const redisConfig = require('../config/redis');
const { redisClient } = redisConfig;
const { error: _error } = require('../utils/logger');


async function scrapeReviews(productName) {
  // Common product aspects that people review
  const aspects = ['quality', 'durability', 'performance', 'value', 'design', 'features', 'ease of use'];
  
  // Review sentiment patterns` 
  const sentimentPatterns = {
    positive: [
      `Absolutely love the {aspect} of this ${productName}`,
      `The ${productName}'s {aspect} exceeded my expectations`,
      `Impressive {aspect}, definitely worth the investment`,
      `Cannot say enough good things about the {aspect}`,
    ],
    negative: [
      `Disappointed with the {aspect} of this ${productName}`,
      `The ${productName}'s {aspect} needs improvement`,
      `Not impressed with the {aspect}`,
      `Expected better {aspect} for the price`,
    ],
    neutral: [
      `The {aspect} is decent but could be better`,
      `Average {aspect} compared to similar products`,
      `Nothing special about the {aspect}`,
    ]
  };

  function generateReviewText(rating) {
    const sentiment = rating >= 4 ? 'positive' : rating <= 2 ? 'negative' : 'neutral';
    const selectedAspects = shuffleArray([...aspects]).slice(0, Math.floor(Math.random() * 3) + 1);
    
    let review = '';
    selectedAspects.forEach((aspect, index) => {
      const patterns = sentimentPatterns[sentiment];
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      review += pattern.replace('{aspect}', aspect);
      if (index < selectedAspects.length - 1) {
        review += '. ';
      }
    });
    
    return review;
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }


  try {
    const numberOfReviews = 5;
    const mockReviews = [];

    for (let i = 0; i < numberOfReviews; i++) {
      const daysAgo = Math.floor(Math.random() * 90); // Reviews up to 90 days old
      const rating = Math.floor(Math.random() * 5) + 1;
      
      const review = {
        id: i + 1,
        rating,
        date: new Date(Date.now() - (daysAgo * 86400000)).toISOString(),
        author: `User${Math.random().toString(36).substring(2, 8)}`,
        text: generateReviewText(rating),
        purchaseDate: new Date(Date.now() - ((daysAgo + Math.floor(Math.random() * 30)) * 86400000)).toISOString(),
      };

      mockReviews.push(review);
    }

    // Sort by date (newest first)
    mockReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockReviews;
  } catch (error) {
    _error('Error generating mock reviews:', error);
    throw error;
  }
}


async function analyzeSentiment(review) {
  try {
    // Call Ollama instance with model from environment variables
    const response = await post(process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate', {
      model: process.env.OLLAMA_MODEL || 'llama3.2',
      prompt: `Analyze the sentiment of this review and return a score between 0 (very negative) and 10 (very positive): "${review.text}. Give out only score number and no explaination in output"`,
      stream: false
    });
 
    // Parse the response to extract sentiment score
    const result = response.data.response;
    // Convert text response to numerical score (implementation depends on model output format)
    const score = parseFloat(result);
    return score;
  } catch (error) {
    _error('Error analyzing sentiment:', error);
    throw error;
  }
}


async function calculateAndStoreScore(productUUID, sentimentScores) {
  try {
    const averageScore = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
    
    // Store in Redis
    await redisClient.set(`score:${productUUID}`, averageScore.toString());
    
    return {
      productUUID,
      averageScore,
      totalReviews: sentimentScores.length
    };
  } catch (error) {
    _error('Error calculating and storing score:', error);
    throw error;
  }
}

async function storeProductInDB(productName) {
  try {

    //random product uuid generator
    const productUUID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Store in Redis
    await redisClient.set(`${productUUID}`, `${productName}`);

    return productUUID;
 
  } catch (error) {
    _error('Error calculating and storing score:', error);
    throw error;
  }
}

module.exports = {
  storeProductInDB,
  scrapeReviews,
  analyzeSentiment,
  calculateAndStoreScore
};
