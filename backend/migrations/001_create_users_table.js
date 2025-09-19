/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('avatar_url');
    table.boolean('email_verified').defaultTo(false);
    table.string('email_verification_token');
    table.timestamp('email_verification_expires');
    table.string('password_reset_token');
    table.timestamp('password_reset_expires');
    table.string('refresh_token');
    table.timestamp('refresh_token_expires');
    table.enum('subscription_tier', ['free', 'creator', 'studio', 'enterprise']).defaultTo('free');
    table.string('stripe_customer_id');
    table.string('stripe_subscription_id');
    table.timestamp('subscription_expires_at');
    table.integer('monthly_usage').defaultTo(0);
    table.integer('monthly_limit').defaultTo(10);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login_at');
    table.timestamps(true, true);
    
    // Indexes
    table.index('email');
    table.index('subscription_tier');
    table.index('stripe_customer_id');
    table.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
