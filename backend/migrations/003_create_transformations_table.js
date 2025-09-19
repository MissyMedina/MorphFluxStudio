/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('transformations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('input_image_id').references('id').inTable('images').onDelete('CASCADE');
    table.uuid('output_image_id').references('id').inTable('images').onDelete('SET NULL');
    table.enum('type', [
      'background_removal',
      'background_replacement',
      'age_progression',
      'age_regression',
      'style_transfer',
      'object_removal',
      'object_addition',
      'face_enhancement',
      'figurine_creation',
      'family_time_capsule',
      'generational_bridge',
      'fantasy_character',
      'memory_reconstruction',
      'pose_manipulation',
      'temporal_twins',
      'story_mode',
      'dynasty_portraits',
      'identity_fusion',
      'lifestyle_teleport'
    ]).notNullable();
    table.enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled']).defaultTo('pending');
    table.json('parameters').notNullable();
    table.json('result_metadata');
    table.text('error_message');
    table.integer('processing_time_ms');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamps(true, true);
    
    // Indexes
    table.index('user_id');
    table.index('input_image_id');
    table.index('type');
    table.index('status');
    table.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('transformations');
};
