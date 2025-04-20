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

Temporal is a workflow orchestration platform that provides significant advantages for applications like this sentiment analysis service:

### Reliability Through Durable Execution

Suppose we deploy this on public cloud like AWS with scalable architecture, them this traditional distributed systems may face numerous challenges when executing multi-step processes:
- Network failures during API calls to external services
- Process crashes during long-running operations
- Timeouts when calling LLM services under high load
- Lost work when servers restart

**Temporal solves these problems** by providing durable execution guarantees. Each step in our sentiment analysis process (product registration,review scraping, LLM analysis, score calculation) is recorded in Temporal's event history. If any step fails, Temporal automatically retries from the exact point of failure without losing progress.

### Workflow as Code

Our sentiment analysis process is expressed as a simple, linear 4-step workflow in code:

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

This code is both the definition of the workflow and its implementation. There's no need for separate workflow configuration files or complex state machines.

### Distributed System Challenges Solved

Temporal addresses key distributed system challenges that would otherwise require complex custom solutions:

1. **Activity Retries**: Each activity has configurable retry policies with exponential backoff, handling transient failures automatically.

2. **Timeouts**: Activities have configurable timeouts to prevent indefinite waiting on external services.

3. **Scalability**: Workers can be scaled independently to handle increased load.

4. **Visibility**: The Temporal Web UI provides real-time visibility into workflow execution, making debugging and monitoring straightforward.

5. **Versioning**: Workflow code can be updated while maintaining compatibility with running workflows.

### Comparison with Alternative Approaches

| Approach | Drawbacks |
|----------|-----------|
| **Cron Jobs** | No automatic retries, poor visibility, difficult to coordinate multiple steps |
| **Message Queues** | Complex error handling, no built-in workflow state, difficult to implement retries |
| **Custom State Machines** | High development overhead, difficult to maintain, limited visibility |
| **Serverless Functions** | Timeout limitations, no built-in state management, complex orchestration |

Temporal provides a comprehensive solution that addresses all these challenges in a developer-friendly way.

## Features

- Scrapes product reviews from online sources
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
   - Fetches product reviews from online sources
   - Handles rate limiting and pagination
   - Validates and sanitizes review data

3. **Sentiment Analysis**:
   - Processes reviews using Llama 3.2 model via Ollama
   - Extracts sentiment scores and key phrases
   - Handles batch processing for efficiency

4. **Score Calculation**:
   - Aggregates individual review sentiments
   - Calculates weighted average scores
   - Stores results in Redis with TTL

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




