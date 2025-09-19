const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.avatar_url = data.avatar_url;
    this.email_verified = data.email_verified;
    this.email_verification_token = data.email_verification_token;
    this.email_verification_expires = data.email_verification_expires;
    this.password_reset_token = data.password_reset_token;
    this.password_reset_expires = data.password_reset_expires;
    this.refresh_token = data.refresh_token;
    this.refresh_token_expires = data.refresh_token_expires;
    this.subscription_tier = data.subscription_tier;
    this.stripe_customer_id = data.stripe_customer_id;
    this.stripe_subscription_id = data.stripe_subscription_id;
    this.subscription_expires_at = data.subscription_expires_at;
    this.monthly_usage = data.monthly_usage;
    this.monthly_limit = data.monthly_limit;
    this.is_active = data.is_active;
    this.last_login_at = data.last_login_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    const {
      email,
      password,
      first_name,
      last_name,
      subscription_tier = 'free'
    } = userData;

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const email_verification_token = uuidv4();
    const email_verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [user] = await db('users')
      .insert({
        email,
        password_hash,
        first_name,
        last_name,
        subscription_tier,
        email_verification_token,
        email_verification_expires,
        monthly_limit: this.getMonthlyLimit(subscription_tier)
      })
      .returning('*');

    return new User(user);
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const user = await db('users')
      .where({ email })
      .first();

    return user ? new User(user) : null;
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const user = await db('users')
      .where({ id })
      .first();

    return user ? new User(user) : null;
  }

  /**
   * Find user by email verification token
   */
  static async findByEmailVerificationToken(token) {
    const user = await db('users')
      .where({ email_verification_token: token })
      .where('email_verification_expires', '>', new Date())
      .first();

    return user ? new User(user) : null;
  }

  /**
   * Find user by password reset token
   */
  static async findByPasswordResetToken(token) {
    const user = await db('users')
      .where({ password_reset_token: token })
      .where('password_reset_expires', '>', new Date())
      .first();

    return user ? new User(user) : null;
  }

  /**
   * Verify password
   */
  async verifyPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  /**
   * Update user
   */
  async update(updates) {
    const [updatedUser] = await db('users')
      .where({ id: this.id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');

    return new User(updatedUser);
  }

  /**
   * Mark email as verified
   */
  async markEmailVerified() {
    return this.update({
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null
    });
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken() {
    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.update({
      password_reset_token: token,
      password_reset_expires: expires
    });

    return token;
  }

  /**
   * Reset password
   */
  async resetPassword(newPassword) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    return this.update({
      password_hash,
      password_reset_token: null,
      password_reset_expires: null
    });
  }

  /**
   * Set refresh token
   */
  async setRefreshToken(token) {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return this.update({
      refresh_token: token,
      refresh_token_expires: expires
    });
  }

  /**
   * Clear refresh token
   */
  async clearRefreshToken() {
    return this.update({
      refresh_token: null,
      refresh_token_expires: null
    });
  }

  /**
   * Update last login
   */
  async updateLastLogin() {
    return this.update({
      last_login_at: new Date()
    });
  }

  /**
   * Check if user has reached monthly limit
   */
  hasReachedMonthlyLimit() {
    return this.monthly_usage >= this.monthly_limit;
  }

  /**
   * Increment monthly usage
   */
  async incrementUsage() {
    return this.update({
      monthly_usage: this.monthly_usage + 1
    });
  }

  /**
   * Reset monthly usage (called at start of new billing period)
   */
  async resetMonthlyUsage() {
    return this.update({
      monthly_usage: 0
    });
  }

  /**
   * Get monthly limit based on subscription tier
   */
  static getMonthlyLimit(tier) {
    const limits = {
      free: 10,
      creator: 100,
      studio: -1, // unlimited
      enterprise: -1 // unlimited
    };
    return limits[tier] || 10;
  }

  /**
   * Get public user data (without sensitive information)
   */
  toPublicJSON() {
    return {
      id: this.id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      avatar_url: this.avatar_url,
      email_verified: this.email_verified,
      subscription_tier: this.subscription_tier,
      monthly_usage: this.monthly_usage,
      monthly_limit: this.monthly_limit,
      is_active: this.is_active,
      last_login_at: this.last_login_at,
      created_at: this.created_at
    };
  }

  /**
   * Get user data for JWT payload
   */
  toJWTPayload() {
    return {
      id: this.id,
      email: this.email,
      subscription_tier: this.subscription_tier,
      email_verified: this.email_verified
    };
  }
}

module.exports = User;
