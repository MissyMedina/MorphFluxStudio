const { db } = require('../config/database');

class Transformation {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.input_image_id = data.input_image_id;
    this.output_image_id = data.output_image_id;
    this.type = data.type;
    this.status = data.status;
    this.parameters = data.parameters;
    this.result_metadata = data.result_metadata;
    this.error_message = data.error_message;
    this.processing_time_ms = data.processing_time_ms;
    this.started_at = data.started_at;
    this.completed_at = data.completed_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new transformation
   */
  static async create(transformationData) {
    const {
      user_id,
      input_image_id,
      type,
      parameters
    } = transformationData;

    const [transformation] = await db('transformations')
      .insert({
        user_id,
        input_image_id,
        type,
        parameters: JSON.stringify(parameters),
        status: 'pending'
      })
      .returning('*');

    return new Transformation(transformation);
  }

  /**
   * Find transformation by ID
   */
  static async findById(id) {
    const transformation = await db('transformations')
      .where({ id })
      .first();

    return transformation ? new Transformation(transformation) : null;
  }

  /**
   * Find transformations by user ID
   */
  static async findByUserId(userId, limit = 50, offset = 0) {
    const transformations = await db('transformations')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return transformations.map(t => new Transformation(t));
  }

  /**
   * Find pending transformations
   */
  static async findPending(limit = 10) {
    const transformations = await db('transformations')
      .where({ status: 'pending' })
      .orderBy('created_at', 'asc')
      .limit(limit);

    return transformations.map(t => new Transformation(t));
  }

  /**
   * Update transformation
   */
  async update(updates) {
    const [updatedTransformation] = await db('transformations')
      .where({ id: this.id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');

    return new Transformation(updatedTransformation);
  }

  /**
   * Mark transformation as processing
   */
  async markAsProcessing() {
    return this.update({
      status: 'processing',
      started_at: new Date()
    });
  }

  /**
   * Mark transformation as completed
   */
  async markAsCompleted(outputImageId, resultMetadata, processingTimeMs) {
    return this.update({
      status: 'completed',
      output_image_id: outputImageId,
      result_metadata: JSON.stringify(resultMetadata),
      processing_time_ms: processingTimeMs,
      completed_at: new Date()
    });
  }

  /**
   * Mark transformation as failed
   */
  async markAsFailed(errorMessage) {
    return this.update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date()
    });
  }

  /**
   * Cancel transformation
   */
  async cancel() {
    return this.update({
      status: 'cancelled',
      completed_at: new Date()
    });
  }

  /**
   * Get transformation with related data
   */
  static async findByIdWithImages(id) {
    const transformation = await db('transformations')
      .leftJoin('images as input_image', 'transformations.input_image_id', 'input_image.id')
      .leftJoin('images as output_image', 'transformations.output_image_id', 'output_image.id')
      .select(
        'transformations.*',
        'input_image.original_filename as input_filename',
        'input_image.cdn_url as input_url',
        'input_image.width as input_width',
        'input_image.height as input_height',
        'output_image.original_filename as output_filename',
        'output_image.cdn_url as output_url',
        'output_image.width as output_width',
        'output_image.height as output_height'
      )
      .where('transformations.id', id)
      .first();

    return transformation ? new Transformation(transformation) : null;
  }

  /**
   * Count transformations by user ID
   */
  static async countByUserId(userId) {
    const result = await db('transformations')
      .where({ user_id: userId })
      .count('* as count')
      .first();

    return parseInt(result.count);
  }

  /**
   * Get transformation statistics
   */
  static async getStats(userId) {
    const stats = await db('transformations')
      .where({ user_id: userId })
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as completed', ['completed']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as failed', ['failed']),
        db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as processing', ['processing']),
        db.raw('AVG(processing_time_ms) as avg_processing_time')
      )
      .first();

    return stats;
  }

  /**
   * Get public transformation data
   */
  toPublicJSON() {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      parameters: this.parameters ? JSON.parse(this.parameters) : null,
      result_metadata: this.result_metadata ? JSON.parse(this.result_metadata) : null,
      error_message: this.error_message,
      processing_time_ms: this.processing_time_ms,
      started_at: this.started_at,
      completed_at: this.completed_at,
      created_at: this.created_at
    };
  }

  /**
   * Get full transformation data
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      input_image_id: this.input_image_id,
      output_image_id: this.output_image_id,
      type: this.type,
      status: this.status,
      parameters: this.parameters ? JSON.parse(this.parameters) : null,
      result_metadata: this.result_metadata ? JSON.parse(this.result_metadata) : null,
      error_message: this.error_message,
      processing_time_ms: this.processing_time_ms,
      started_at: this.started_at,
      completed_at: this.completed_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Transformation;
