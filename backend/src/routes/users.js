const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Image = require('../models/Image');
const Transformation = require('../models/Transformation');
const { authenticate, requireEmailVerification } = require('../middleware/auth');
const { validate, profileUpdateSchema, passwordChangeSchema } = require('../utils/validation');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toPublicJSON()
    }
  });
});

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, validate(profileUpdateSchema), async (req, res) => {
  try {
    const user = req.user;
    const updates = req.body;
    
    // Update user
    const updatedUser = await user.update(updates);
    
    logger.info(`User profile updated: ${user.id}`);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.toPublicJSON()
      }
    });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * @route   POST /api/v1/users/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, validate(passwordChangeSchema), async (req, res) => {
  try {
    const user = req.user;
    const { current_password, new_password } = req.body;
    
    // Verify current password
    const isCurrentPasswordValid = await user.verifyPassword(current_password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Update password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(new_password, saltRounds);
    
    await user.update({ password_hash });
    
    logger.info(`Password changed for user: ${user.id}`);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

/**
 * @route   GET /api/v1/users/usage
 * @desc    Get user usage statistics
 * @access  Private
 */
router.get('/usage', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Get usage statistics
    const usage = {
      monthly_usage: user.monthly_usage,
      monthly_limit: user.monthly_limit,
      usage_percentage: user.monthly_limit > 0 
        ? Math.round((user.monthly_usage / user.monthly_limit) * 100) 
        : 0,
      remaining_usage: user.monthly_limit > 0 
        ? Math.max(0, user.monthly_limit - user.monthly_usage) 
        : -1, // unlimited
      subscription_tier: user.subscription_tier,
      reset_date: user.subscription_expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default to 30 days from now
    };
    
    res.json({
      success: true,
      data: {
        usage
      }
    });
  } catch (error) {
    logger.error('Usage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage statistics'
    });
  }
});

/**
 * @route   GET /api/v1/users/activity
 * @desc    Get user activity history
 * @access  Private
 */
router.get('/activity', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Get recent transformations
    const transformations = await Transformation.findByUserId(user.id, limit, offset);
    
    // Get total count
    const totalCount = await Transformation.countByUserId(user.id);
    
    res.json({
      success: true,
      data: {
        activity: transformations.map(t => t.toPublicJSON()),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Activity history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve activity history'
    });
  }
});

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { password } = req.body;
    
    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Password is incorrect'
      });
    }
    
    // Deactivate account instead of deleting (for data retention)
    await user.update({ 
      is_active: false,
      email: `deleted_${Date.now()}_${user.email}` // Anonymize email
    });
    
    logger.info(`Account deactivated: ${user.id}`);
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

/**
 * @route   POST /api/v1/users/export-data
 * @desc    Export user data (GDPR compliance)
 * @access  Private
 */
router.post('/export-data', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Get user data
    const userData = {
      profile: user.toPublicJSON(),
      images: await Image.findByUserId(user.id, 1000, 0), // Get all images
      transformations: await Transformation.findByUserId(user.id, 1000, 0) // Get all transformations
    };
    
    // Generate export file
    const exportData = {
      export_date: new Date().toISOString(),
      user_data: userData
    };
    
    res.json({
      success: true,
      message: 'Data export generated successfully',
      data: {
        export: exportData
      }
    });
  } catch (error) {
    logger.error('Data export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

/**
 * @route   GET /api/v1/users/subscription
 * @desc    Get user subscription details
 * @access  Private
 */
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    const subscription = {
      tier: user.subscription_tier,
      status: user.subscription_expires_at && user.subscription_expires_at > new Date() ? 'active' : 'inactive',
      expires_at: user.subscription_expires_at,
      stripe_customer_id: user.stripe_customer_id,
      stripe_subscription_id: user.stripe_subscription_id,
      monthly_limit: user.monthly_limit,
      current_usage: user.monthly_usage
    };
    
    res.json({
      success: true,
      data: {
        subscription
      }
    });
  } catch (error) {
    logger.error('Subscription details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve subscription details'
    });
  }
});

module.exports = router;
