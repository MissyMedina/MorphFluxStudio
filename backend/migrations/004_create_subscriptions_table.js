/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('subscriptions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('stripe_subscription_id').unique();
    table.string('stripe_price_id');
    table.enum('tier', ['free', 'creator', 'studio', 'enterprise']).notNullable();
    table.enum('status', ['active', 'inactive', 'cancelled', 'past_due', 'unpaid']).defaultTo('active');
    table.timestamp('current_period_start');
    table.timestamp('current_period_end');
    table.timestamp('canceled_at');
    table.timestamp('ended_at');
    table.integer('monthly_limit');
    table.integer('current_usage').defaultTo(0);
    table.decimal('amount', 10, 2);
    table.string('currency', 3).defaultTo('usd');
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('stripe_subscription_id');
    table.index('status');
    table.index('tier');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('subscriptions');
};
