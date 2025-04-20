require('dotenv').config();

const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: process.env.ERROR_LOG_PATH || 'error.log', level: 'error' }),
    new winston.transports.File({ filename: process.env.COMBINED_LOG_PATH || 'combined.log' })
  ]
});

module.exports = logger;
