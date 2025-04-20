// Import dotenv at the top of the file
// dotenv is used to load environment variables from a .env file into process.env
require('dotenv').config();

const express = require('express');
const { json } = express;
const { WorkflowClient } = require('@temporalio/client');
const routes = require('./api/routes');
const { error: _error, info } = require('./utils/logger');
const { sanitize } = require('dompurify');
const { connectRedis } = require('./config/redis');


const app = express();
const port = process.env.PORT || 3000;

app.use(json());
async function initRedis() {
  // Connect to Redis
  await connectRedis();
}
initRedis();
// Register routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  _error('Error:', sanitize(err.toString()));
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  info(`Server is running on port ${port}`);
});