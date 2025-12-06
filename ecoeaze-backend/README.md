# EcoEaze Backend 🌱

A modern e-commerce platform for sustainable farming and organic produce, built with Node.js, Express, MongoDB, Redis, and Celery.

## Features

- RESTful API with JWT authentication
- Role-based access: Customers, Farmers, Admin roles
- Product catalog with organic certifications
- Cart & Orders with real-time inventory
- Reviews & ratings
- Redis caching & inventory locking
- Celery for background tasks (emails, image processing, analytics)
- Prometheus metrics & Logstash-ready JSON logs

---

## 1. Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy .env.example to .env and configure
cp .env.example .env

# 3. Start MongoDB (assumes localhost:27017)
# mongod

# 4. Start Redis (assumes localhost:6379)
# redis-server

# 5. Start the Node.js server
npm run dev
```

Your backend API will be available at http://localhost:5001/api

---

## 2. Redis and Celery

This application extensively uses Redis and Celery for various features:

### Redis Usage:
- **Caching**: API response caching for better performance
- **Sessions**: User session storage
- **Rate Limiting**: Prevent API abuse
- **Inventory Locking**: Prevent race conditions
- **Task Queues**: Message broker for Celery

### Celery Usage:
- **Background Tasks**: Email sending, SMS notifications
- **Image Processing**: Product image optimization
- **Analytics**: Report generation
- **Inventory Management**: Low stock alerts

For detailed information on Redis and Celery usage, see [REDIS_CELERY_USAGE.md](REDIS_CELERY_USAGE.md)

---

## 3. API Documentation

See [GreenHarvest_API_Collection.json](GreenHarvest_API_Collection.json) for a complete Postman collection.

Or see [THUNDER_CLIENT_INSTRUCTIONS.md](THUNDER_CLIENT_INSTRUCTIONS.md) for VS Code Thunder Client instructions.

---

## 4. Project Structure

```
src/
├── config/         # Configuration files (db, redis, jwt, etc.)
├── controllers/    # Request handlers
├── middleware/     # Custom middleware (auth, cache, etc.)
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── tasks/          # Celery tasks (Python)
├── utils/          # Helper functions
└── app.js          # Express app setup
```

---

## 5. Environment Variables

See [.env.example](.env.example) for all required environment variables.

---

## 6. Development

```bash
# Run in development mode with nodemon
npm run dev

# Run tests (if any)
npm test

# Lint code
npm run lint
```