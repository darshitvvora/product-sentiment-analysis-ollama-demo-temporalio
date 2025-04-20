require('dotenv').config();

const { Router } = require('express');
const { Connection, Client } = require('@temporalio/client');
const redisConfig = require('../config/redis');
const { redisClient } = redisConfig;
const { error: _error } = require('../utils/logger');


const router = Router();

// Initialize Temporal client
let temporalClient;
async function initTemporalClient() {
  const connection = await Connection.connect();
  temporalClient = new Client({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE|| 'default',
  });
}
initTemporalClient();

// Start sentiment analysis workflow for a product
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { productName } = req.body;
    
    
    if (!productName) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const handle = await temporalClient.workflow.start('productSentimentWorkflow', {
      args: [productName],
      taskQueue: process.env.TEMPORAL_TASKQ || 'sentiment-analysis',
      workflowId: `sentiment-analysis-${productName}-${Date.now()}`,
    });

    res.json({
      message: 'Sentiment analysis workflow started',
      workflowId: handle.workflowId
    });
  } catch (error) {
    _error('Error starting workflow:', error);
    res.status(500).json({ error: 'Failed to start sentiment analysis' });
  }
});

// Get sentiment score for a product
router.get('/sentiment/:productUUID', async (req, res) => {
  
  try {
    console.log('req.params:', req.params);
    const { productUUID } = req.params;
    const score = await redisClient.get(`score:${productUUID}`);
    const productName = await redisClient.get(`${productUUID}`);

    
    if (!score) {
      return res.status(404).json({ error: 'Sentiment score not found for this product' });
    }

    res.json({
      productUUID,
      productName,
      sentimentScore: parseFloat(score)
    });
  } catch (error) {
    _error('Error retrieving sentiment score:', error);
    res.status(500).json({ error: 'Failed to retrieve sentiment score' });
  }
});

module.exports = router;