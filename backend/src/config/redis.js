const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;

/**
 * Connect to Redis
 */
async function connectRedis() {
  try {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server connection refused');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    };

    redisClient = redis.createClient(redisConfig);

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis connection error:', err);
    });

    redisClient.on('end', () => {
      logger.info('Redis connection ended');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    // Don't throw error in development, allow app to continue without Redis
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

/**
 * Get Redis client
 */
function getRedisClient() {
  return redisClient;
}

/**
 * Close Redis connection
 */
async function closeRedis() {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('✅ Redis connection closed');
    }
  } catch (error) {
    logger.error('❌ Error closing Redis connection:', error);
  }
}

/**
 * Cache helper functions
 */
const cache = {
  async get(key) {
    try {
      if (!redisClient) return null;
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      if (!redisClient) return false;
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  },

  async del(key) {
    try {
      if (!redisClient) return false;
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis delete error:', error);
      return false;
    }
  },

  async exists(key) {
    try {
      if (!redisClient) return false;
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  }
};

module.exports = {
  connectRedis,
  closeRedis,
  getRedisClient,
  cache
};
