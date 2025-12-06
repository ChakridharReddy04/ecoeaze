// src/controllers/healthController.js
import mongoose from 'mongoose';
import redis from '../config/redis.js';

export const healthCheck = async (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: 'unknown',
        details: null
      },
      redis: {
        status: 'unknown',
        details: null
      }
    }
  };

  try {
    // Check MongoDB
    if (mongoose.connection.readyState === 1) {
      healthData.services.database.status = 'connected';
      healthData.services.database.details = {
        host: mongoose.connection.host,
        name: mongoose.connection.name
      };
    } else {
      healthData.services.database.status = 'disconnected';
      healthData.status = 'degraded';
    }
  } catch (error) {
    healthData.services.database.status = 'error';
    healthData.services.database.details = error.message;
    healthData.status = 'error';
  }

  try {
    // Check Redis if not skipped
    if (process.env.SKIP_REDIS !== 'true') {
      await redis.ping();
      healthData.services.redis.status = 'connected';
    } else {
      healthData.services.redis.status = 'skipped';
    }
  } catch (error) {
    healthData.services.redis.status = 'error';
    healthData.services.redis.details = error.message;
    healthData.status = 'error';
  }

  // HTTP-specific data
  healthData.http = {
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type')
    }
  };

  const statusCode = healthData.status === 'ok' ? 200 : 
                    healthData.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(healthData);
};

export default {
  healthCheck
};