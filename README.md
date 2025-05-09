# Product Sentiment Analysis with Ollama & Temporal Workflow

This project demonstrates a Temporal workflow implementation for analyzing product sentiment using review scraping and LLM-based sentiment analysis with Ollama.

## Table of Contents

- [Overview](#overview)
- [Why Temporal Workflows?](#why-temporal-workflows)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Monitoring and Logging](#monitoring-and-logging)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)
- [Author](#author)

## Overview

Product Sentiment Analysis is a demo service that helps businesses understand customer sentiment about their products by analyzing online reviews. The application scrapes product reviews, performs sentiment analysis using LLM technology, and provides aggregated sentiment scores through a simple API.

## Why Temporal Workflows?

Temporal is a workflow orchestration platform that provides significant advantages for this sentiment analysis service:

### Reliability and Durability

Traditional distributed systems face challenges like network failures, process crashes, and timeouts when executing multi-step processes. Temporal solves these by providing durable execution guarantees - each step in our sentiment analysis process is recorded, and if any step fails, Temporal automatically retries from the exact point of failure without losing progress.

### Workflow as Code

Our sentiment analysis process is expressed as a simple, linear workflow:

```javascript
async function productSentimentWorkflow(productName) {
  // Step 1: Store product info
  const productUUID = await activities.storeProductInDB(productName);
  
  // Step 2: Scrape reviews
  const reviews = await activities.scrapeReviews(productName);
  
  // Step 3: Analyze sentiment for each review
  const sentimentResults = await Promise.all(
    reviews.map(review => activities.analyzeSentiment(review))
  );
  
  // Step 4: Calculate average and store in Redis
  return await activities.calculateAndStoreScore(productUUID, sentimentResults);
}
```

This code serves as both the definition and implementation of the workflow, eliminating the need for separate configuration files or complex state machines.

### Key Benefits

- **Automatic Retries**: Configurable retry policies with exponential backoff
- **Timeout Management**: Prevents indefinite waiting on external services
- **Scalability**: Workers can be scaled independently to handle increased load
- **Visibility**: Web UI provides real-time monitoring and debugging
- **Versioning**: Code can be updated while maintaining compatibility with running workflows

### Comparison with Alternatives

| Approach | Drawbacks |
|----------|-----------|
| **Cron Jobs** | No automatic retries, poor visibility, difficult coordination |
| **Message Queues** | Complex error handling, no built-in workflow state |
| **Custom State Machines** | High development overhead, difficult maintenance |
| **Serverless Functions** | Timeout limitations, complex orchestration |

Temporal provides a comprehensive solution to these challenges in a developer-friendly way.

## Features

- Scrapes product reviews from online sources (right now its fake simulation implementation can be changed to scrape from API)
- Performs sentiment analysis using Llama 3.2 (via Ollama)
- Calculates and stores average sentiment scores in Redis
- Provides API endpoints to trigger analysis and retrieve results
- Built with Temporal.io for reliable workflow orchestration
- Comprehensive error handling and monitoring

## Architecture

The application uses a Temporal workflow architecture with four main activities:

1. **Product Registration**:
   - Stores product information in Redis
   - Generates a unique product UUID
   - Sets up initial data structures

2. **Review Scraping**:
   - Fetches product reviews from online sources (fake simulation)

3. **Sentiment Analysis**:
   - Processes reviews using Llama 3.2 model via Ollama
   - Extracts sentiment scores and key phrases

4. **Score Calculation**:
   - Aggregates individual review sentiments
   - Calculates weighted average scores
   - Stores results in Redis

### Workflow Execution Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │     │                 │
│  Store Product  │────▶│  Scrape Reviews │────▶│ Analyze Reviews │────▶│ Calculate Score │
│                 │     │                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### System Components

- **Express API Server**: Handles HTTP requests and initiates workflows
- **Temporal Worker**: Executes workflow activities
- **Redis**: Stores product data and sentiment scores
- **Ollama**: Runs the Llama 3.2 model for sentiment analysis

## Prerequisites

- Node.js 16+ (with npm)
- Redis server 6.2.0 or higher ([Installation Guide](https://redis.io/docs/getting-started/installation/))
- Temporal server v1.8.0 or higher ([Installation Guide](https://docs.temporal.io/dev-guide/typescript/foundations#run-a-development-server)) OR use Temporal Cloud 
- Ollama with llama3.2 model ([Installation Guide](https://github.com/ollama/ollama))
- Git for version control

## Project Structure

```
src/
├── activities/     # Temporal workflow activities
├── api/           # Express API routes and controllers
├── config/        # Application configuration
├── utils/         # Utility functions and helpers
├── workflows/     # Temporal workflow definitions
├── index.js       # Application entry point
└── worker.js      # Temporal worker process
```

## Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file and configure:
   ```bash
   cp .env.example .env
   ```

3. Start the required services:

   a. Start Redis server:
   ```bash
   npm run redis
   # or
   redis-server
   ```

   b. Start Temporal development server:
   ```bash
   npm run temporal-server-dev
   ```

   c. Start Ollama with llama3.2:
   ```bash
   npm run ollama
   ```

4. Start the Temporal worker:
   ```bash
   npm run worker
   ```

5. Start the application:
   ```bash
   npm start
   ```

## Available Scripts

- `npm start`: Start the application in production mode
- `npm run dev`: Run in development mode with auto-reload using nodemon
- `npm test`: Run the Jest test suite
- `npm run worker`: Start the Temporal worker process
- `npm run redis`: Start the Redis server instance
- `npm run temporal-server-dev`: Start Temporal development server for workflow orchestration
- `npm run ollama`: Start Ollama with llama3.2 model for sentiment analysis

## API Endpoints

1. Start Sentiment Analysis:
   ```bash
   POST /api/analyze-sentiment
   Content-Type: application/json
   
   {
     "productName": "product_name"
   }
   ```

   **Sample curl command:**
   ```bash
   curl -X POST http://localhost:3000/api/analyze-sentiment \
     -H "Content-Type: application/json" \
     -d '{"productName": "iPhone 15"}'
   ```

   **Expected Response:**
   ```json
   {
     "message": "Sentiment analysis workflow started",
     "workflowId": "sentiment-analysis-iPhone 15-1684847521234"
   }
   ```

   **Postman Example:**
   - Method: POST
   - URL: http://localhost:3000/api/analyze-sentiment
   - Headers: Content-Type: application/json
   - Body (raw, JSON):
     ```json
     {
       "productName": "iPhone 15"
     }
     ```

2. Get Sentiment Score:
   ```bash
   GET /api/sentiment/:productUUID
   ```

   **Sample curl command:**
   ```bash
   curl -X GET http://localhost:3000/api/sentiment/abc123-uuid-example
   ```

   **Expected Response:**
   ```json
   {
     "productUUID": "abc123-uuid-example",
     "productName": "iPhone 15",
     "sentimentScore": 0.85
   }
   ```

   **Postman Example:**
   - Method: GET
   - URL: http://localhost:3000/api/sentiment/abc123-uuid-example
   - No headers or body required

### Postman Collection

You can import the following Postman collection to quickly test the API:

```json
{
  "info": {
    "_postman_id": "your-postman-id",
    "name": "Product Sentiment Analysis API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Start Sentiment Analysis",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"productName\": \"iPhone 15\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/analyze-sentiment",
          "protocol": "http",
          "host": [
            "localhost"
          ],
          "port": "3000",
          "path": [
            "api",
            "analyze-sentiment"
          ]
        }
      }
    },
    {
      "name": "Get Sentiment Score",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3000/api/sentiment/abc123-uuid-example",
          "protocol": "http",
          "host": [
            "localhost"
          ],
          "port": "3000",
          "path": [
            "api",
            "sentiment",
            "abc123-uuid-example"
          ]
        }
      }
    }
  ]
}
```
## Error Handling

- Comprehensive error handling at all levels:
  - Network failures and timeouts
  - API rate limiting
  - Invalid input validation
  - Service unavailability
  
- Temporal retry policies:
  - Configurable retry attempts for each activity
  - Exponential backoff strategy
  - Activity-specific timeout settings
  
- Data persistence:
  - Redis connection error recovery
  - Data validation before storage
  - Automatic reconnection handling

## Monitoring and Logging

- Application Logging:
  - Winston logger with multiple transports
  - Log levels: error, warn, info, debug
  - Structured logging format for easy parsing
  
- Temporal Monitoring:
  - Web UI for workflow visualization
  - Real-time workflow status tracking
  - Historical execution data
  
- Performance Metrics:
  - Redis metrics via INFO command
  - API endpoint response times
  - Worker queue statistics

## Environment Variables

The application uses environment variables for configuration. These are loaded from a `.env` file in the root directory. A `.env.example` file is provided as a template.

### Available Environment Variables

```
# Server Configuration
PORT=3000

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Temporal Configuration
TEMPORAL_NAMESPACE=default
TEMPORAL_TASKQ=sentiment-analysis
MAX_CONCURRENT_ACTIVITIES=10
MAX_CONCURRENT_WORKFLOWS=50

# Temporal Worker Timeouts
TEMPORAL_SERVER_URL=localhost:7233
WORKER_START_TO_CLOSE_TIMEOUT=4s
WORKER_SCHEDULE_TO_CLOSE_TIMEOUT=5s
STICKY_QUEUE_SCHEDULE_TO_START_TIMEOUT=1m
DEFAULT_DEADLINE_TIMEOUT=2m
DEFAULT_HEARTBEAT_TIMEOUT=30s

# Temporal Retry Options
RETRY_INITIAL_INTERVAL=1s
RETRY_MAXIMUM_INTERVAL=1m
RETRY_BACKOFF_COEFFICIENT=2
RETRY_MAXIMUM_ATTEMPTS=3


# Ollama Configuration
OLLAMA_API_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3.2

# Logger Configuration
LOG_LEVEL=info
ERROR_LOG_PATH=error.log
COMBINED_LOG_PATH=combined.log
```

### Setting Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file to match your environment:
   ```bash
   nano .env
   ```

3. Make sure the `.env` file is loaded at the start of your application. This is already done in the main entry points of the application.

## Development

1. Start in development mode with auto-reload:
   ```bash
   npm run dev
   ```

2. Environment Configuration:
   - Update `.env` file with required settings
   - Use `.env.example` as a template
   - Never commit sensitive credentials

3. Code Style:
   - Follow JavaScript Standard Style
   - Use async/await for asynchronous operations
   - Include JSDoc comments for functions

## Testing

1. Run the complete test suite:
   ```bash
   npm test
   ```

2. Test Coverage:
   ```bash
   npm test -- --coverage
   ```

## Contributing

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -am 'Add some feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Submit a pull request

Please ensure your PR:
- Includes tests for new functionality
- Updates documentation as needed
- Follows the existing code style
- Includes a clear description of changes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Open an issue in the GitHub repository
- Check existing issues for solutions
- Review the documentation first

## Author

This project was created and is maintained by **Darshit Vora**.










