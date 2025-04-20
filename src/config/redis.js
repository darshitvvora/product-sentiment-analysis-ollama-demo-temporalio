require('dotenv').config();

const { createClient } = require('redis');
const { error, info } = require('../utils/logger');


const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', err => error('Redis Client Error', err));

const connectRedis = async () => {
  await redisClient.connect();
  info('Redis connected successfully');
};

module.exports = {
  redisClient,
  connectRedis
};