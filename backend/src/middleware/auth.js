const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Get user from database
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        error: 'Access token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.message.includes('Invalid')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token',
        code: 'TOKEN_INVALID'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    
    if (user && user.is_active) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Email verification required middleware
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

/**
 * Subscription tier middleware
 */
const requireSubscription = (requiredTier) => {
  const tierLevels = {
    free: 0,
    creator: 1,
    studio: 2,
    enterprise: 3
  };

  return (req, res, next) => {
    const userTier = tierLevels[req.user.subscription_tier] || 0;
    const requiredLevel = tierLevels[requiredTier] || 0;

    if (userTier < requiredLevel) {
      return res.status(403).json({
        success: false,
        error: `Subscription tier '${requiredTier}' or higher required`,
        code: 'INSUFFICIENT_SUBSCRIPTION'
      });
    }

    next();
  };
};

/**
 * Usage limit middleware
 */
const checkUsageLimit = async (req, res, next) => {
  try {
    if (req.user.hasReachedMonthlyLimit()) {
      return res.status(429).json({
        success: false,
        error: 'Monthly usage limit reached',
        code: 'USAGE_LIMIT_EXCEEDED',
        usage: {
          current: req.user.monthly_usage,
          limit: req.user.monthly_limit
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Usage limit check error:', error);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requireEmailVerification,
  requireSubscription,
  checkUsageLimit
};
