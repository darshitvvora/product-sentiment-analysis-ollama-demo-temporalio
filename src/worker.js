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
      taskQueue: process.env.TEMPORAL_TASKQ || 'sentiment-analysis',
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',

      // Maximum time for a single workflow task execution
      startToCloseTimeout: process.env.WORKER_START_TO_CLOSE_TIMEOUT || '4s',
      // Maximum time from workflow task scheduling to completion
      scheduleToCloseTimeout: process.env.WORKER_SCHEDULE_TO_CLOSE_TIMEOUT || '5s',

      // Concurrency settings
      // Controls how many activities can run simultaneously on this worker (analogy: workers in factory)
      maxConcurrentActivityTaskExecutions: parseInt(process.env.MAX_CONCURRENT_ACTIVITIES, 10) || 10,

      //Controls how many workflow tasks can be processed simultaneously (analogy: managers in factory)
      maxConcurrentWorkflowTaskExecutions: parseInt(process.env.MAX_CONCURRENT_WORKFLOWS, 10) || 50,
  
      // Sticky queue settings. Subsequent tasks for the same workflow are "sticky" - they try to route back to the same worker
      stickyQueueScheduleToStartTimeout: process.env.STICKY_QUEUE_SCHEDULE_TO_START_TIMEOUT || '1m',
      
      // Activity timeout settings
      defaultDeadlineTimeout: process.env.DEFAULT_DEADLINE_TIMEOUT || '2m',    // Maximum time for activity completion
      defaultHeartbeatTimeout: process.env.DEFAULT_HEARTBEAT_TIMEOUT || '30s',  // Activity heartbeat timeout
  
      // Retry settings for activities
      defaultActivityRetryOptions: {
        initialInterval: process.env.RETRY_INITIAL_INTERVAL || '1s',
        maximumInterval: process.env.RETRY_MAXIMUM_INTERVAL || '1m',
        backoffCoefficient: parseFloat(process.env.RETRY_BACKOFF_COEFFICIENT) || 2,
        maximumAttempts: parseInt(process.env.RETRY_MAXIMUM_ATTEMPTS, 10) || 3,
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
