require('dotenv').config();

const { Worker } = require('@temporalio/worker');
const { productSentimentWorkflow } = require('./workflows/sentimentAnalysis.workflow');
const activities = require('./activities');
const logger = require('./utils/logger');
const { connectRedis } = require('./config/redis');


async function run() {
  try {
    // Connect to Redis
    await connectRedis();

    // Create the Worker
    const worker = await Worker.create({
      workflowsPath: require.resolve('./workflows/sentimentAnalysis.workflow'),
      activities,
      taskQueue: process.env.TEMPORAL_TASKQ|| 'sentiment-analysis',
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    });

    // Start accepting tasks
    await worker.run();
    
    logger.info('Worker started successfully');
  } catch (error) {
    logger.error('Worker failed to start:', error);
    process.exit(1);
  }
}

run();