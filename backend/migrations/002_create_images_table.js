/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('images', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('original_filename').notNullable();
    table.string('stored_filename').notNullable();
    table.string('file_path').notNullable();
    table.string('s3_key');
    table.string('s3_bucket');
    table.string('cdn_url');
    table.string('mime_type').notNullable();
    table.integer('file_size').notNullable();
    table.integer('width');
    table.integer('height');
    table.json('metadata');
    table.boolean('is_processed').defaultTo(false);
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('created_at');
    table.index('is_processed');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('images');
};
