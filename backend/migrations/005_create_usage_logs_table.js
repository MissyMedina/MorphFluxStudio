/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('usage_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('transformation_id').references('id').inTable('transformations').onDelete('SET NULL');
    table.enum('action', ['transformation', 'upload', 'download', 'api_call']).notNullable();
    table.string('resource_type');
    table.integer('cost_credits').defaultTo(1);
    table.json('metadata');
    table.string('ip_address');
    table.string('user_agent');
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('transformation_id');
    table.index('action');
    table.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('usage_logs');
};
