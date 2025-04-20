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

      // Maximum time for a single workflow task execution
      startToCloseTimeout: '4s',
      // Maximum time from workflow task scheduling to completion
      scheduleToCloseTimeout: '5s',

      // Concurrency settings
      // Controls how many activities can run simultaneously on this worker (analogy: workers in factory)
      maxConcurrentActivityTaskExecutions: parseInt(process.env.MAX_CONCURRENT_ACTIVITIES, 10) || 10,

      //Controls how many workflow tasks can be processed simultaneously (analogy: managers in factory)
      maxConcurrentWorkflowTaskExecutions: parseInt(process.env.MAX_CONCURRENT_WORKFLOWS, 10) || 50,
  
      // Sticky queue settings. Subsequent tasks for the same workflow are "sticky" - they try to route back to the same worker
      stickyQueueScheduleToStartTimeout: '1m',
      
      // Activity timeout settings
      defaultDeadlineTimeout: '2m',    // Maximum time for activity completion
      defaultHeartbeatTimeout: '30s',  // Activity heartbeat timeout
  
      // Retry settings for activities
      defaultActivityRetryOptions: {
        initialInterval: '1s',
        maximumInterval: '1m',
        backoffCoefficient: 2,
        maximumAttempts: 3,
      }
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