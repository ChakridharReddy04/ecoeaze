# Redis and Celery Usage in EcoEaze Application

This document explains how Redis and Celery are used in the EcoEaze application and how to leverage them for additional features.

## Current Redis Usage

### 1. Caching Layer
- **Purpose**: Cache API responses to improve performance
- **Implementation**: `src/middleware/cacheMiddleware.js`
- **Usage**: Wrap routes with `cacheResponse()` middleware

### 2. Session Storage
- **Purpose**: Store user session data for authentication
- **Implementation**: Built-in Express session handling with Redis store

### 3. Rate Limiting
- **Purpose**: Prevent abuse by limiting request rates
- **Implementation**: `src/config/rateLimiter.js`
- **Usage**: Apply to routes that need protection

### 4. Inventory Locking
- **Purpose**: Prevent race conditions during inventory updates
- **Implementation**: `src/utils/inventoryLock.js`
- **Usage**: Acquire locks before critical inventory operations

### 5. Task Queue Broker
- **Purpose**: Message broker for Celery tasks
- **Implementation**: Redis databases 0 and 1 for broker and results

## Current Celery Usage

### 1. Background Tasks
- **Purpose**: Handle time-consuming operations without blocking the main application
- **Tasks**:
  - `send_email`: Send emails asynchronously
  - `send_sms`: Send SMS messages
  - `low_stock_alert`: Notify farmers of low stock
  - `generate_sales_report`: Create sales reports

### 2. Image Processing
- **Purpose**: Process and optimize uploaded images
- **Tasks**:
  - `optimize_product_image`: Optimize images for web
  - `generate_image_thumbnails`: Create thumbnail sizes

## New Redis and Celery Features Implemented

### 1. Real-time Notifications
- **Redis Pub/Sub**: For real-time notification delivery
- **Redis Lists**: Store user notification history
- **Celery Task**: `send_push_notification` for cross-platform notifications

### 2. Advanced Analytics
- **Redis Sorted Sets**: Store user behavior data
- **Redis Caching**: Cache analytics reports
- **Celery Tasks**:
  - `generate_profit_loss_report`: Farmer financial reports
  - `track_user_behavior`: User analytics tracking
  - `generate_user_engagement_report`: Platform engagement metrics

### 3. Inventory Management
- **Redis Caching**: Product stock levels
- **Redis Time-Series**: Inventory movement tracking
- **Celery Tasks**:
  - `auto_reorder_stock`: Automatic stock replenishment
  - `update_inventory_cache`: Real-time inventory updates
  - `generate_inventory_report`: Comprehensive inventory reports
  - `predict_demand`: Forecast future demand

### 4. Image Optimization
- **Redis Caching**: Processed image metadata
- **Celery Tasks**:
  - `watermark_product_images`: Add farmer watermarks
  - `cleanup_old_images`: Remove temporary files
  - `analyze_image_quality`: Quality assessment and suggestions

## How to Use These Features

### 1. Starting Celery Workers
```bash
# Navigate to the backend directory
cd ecoeaze-backend

# Start the main Celery worker
python celery/celery_worker.py

# Or use the batch file on Windows
start_celery_workers.bat
```

### 2. Starting Celery Beat (Periodic Tasks)
```bash
# Start Celery Beat scheduler
celery -A celery.celery_worker.celery_app beat -l info
```

### 3. Enqueuing Tasks from Node.js
```javascript
// Import the Celery service
import { sendWelcomeEmail, generateProfitLossReport } from './services/celeryService.js';

// Send a welcome email
await sendWelcomeEmail('user@example.com', 'John Doe');

// Generate a profit/loss report
await generateProfitLossReport('farmer123', 'monthly');
```

### 4. Using Redis Directly
```javascript
// Import the Redis service
import { trackUserBehavior, getCachedInventory } from './services/redisService.js';

// Track user behavior
await trackUserBehavior('user123', 'product_view', { productId: 'prod456' });

// Get cached inventory
const stockLevel = await getCachedInventory('prod456');
```

## Additional Implementations You Can Build

### 1. Fraud Detection System
- Use Redis to track suspicious user patterns
- Create Celery tasks to analyze behavior anomalies

### 2. Personalized Recommendations
- Store user preferences in Redis
- Use Celery to generate recommendation lists

### 3. Automated Marketing Campaigns
- Schedule promotional tasks with Celery Beat
- Track campaign effectiveness in Redis

### 4. Real-time Dashboards
- Use Redis Pub/Sub for live updates
- Cache dashboard data for performance

## Redis Database Organization

- **DB 0**: Celery broker
- **DB 1**: Celery results
- **DB 2**: Notifications
- **DB 3**: Analytics
- **DB 4**: Inventory
- **DB 5**: Image processing

## Monitoring and Maintenance

### 1. Monitor Redis Memory Usage
```bash
redis-cli info memory
```

### 2. Check Celery Worker Status
```bash
celery -A celery.celery_worker.celery_app inspect active
```

### 3. View Task Statistics
```bash
celery -A celery.celery_worker.celery_app inspect stats
```

## Best Practices

1. **Error Handling**: Always handle failures gracefully in Celery tasks
2. **Idempotency**: Design tasks to be safely retryable
3. **Resource Management**: Monitor Redis memory and clean up old data
4. **Security**: Protect Redis instances with authentication
5. **Monitoring**: Set up alerts for queue backlogs and worker failures

## Conclusion

Redis and Celery provide powerful capabilities for building scalable, responsive applications. The implementations in EcoEaze demonstrate how to leverage these technologies for caching, background processing, real-time features, and analytics.