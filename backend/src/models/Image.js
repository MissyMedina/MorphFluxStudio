const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Image {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.original_filename = data.original_filename;
    this.stored_filename = data.stored_filename;
    this.file_path = data.file_path;
    this.s3_key = data.s3_key;
    this.s3_bucket = data.s3_bucket;
    this.cdn_url = data.cdn_url;
    this.mime_type = data.mime_type;
    this.file_size = data.file_size;
    this.width = data.width;
    this.height = data.height;
    this.metadata = data.metadata;
    this.is_processed = data.is_processed;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new image record
   */
  static async create(imageData) {
    const {
      user_id,
      original_filename,
      stored_filename,
      file_path,
      s3_key,
      s3_bucket,
      cdn_url,
      mime_type,
      file_size,
      width,
      height,
      metadata
    } = imageData;

    const [image] = await db('images')
      .insert({
        user_id,
        original_filename,
        stored_filename,
        file_path,
        s3_key,
        s3_bucket,
        cdn_url,
        mime_type,
        file_size,
        width,
        height,
        metadata: metadata ? JSON.stringify(metadata) : null
      })
      .returning('*');

    return new Image(image);
  }

  /**
   * Find image by ID
   */
  static async findById(id) {
    const image = await db('images')
      .where({ id })
      .first();

    return image ? new Image(image) : null;
  }

  /**
   * Find images by user ID
   */
  static async findByUserId(userId, limit = 50, offset = 0) {
    const images = await db('images')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return images.map(image => new Image(image));
  }

  /**
   * Count images by user ID
   */
  static async countByUserId(userId) {
    const result = await db('images')
      .where({ user_id: userId })
      .count('* as count')
      .first();

    return parseInt(result.count);
  }

  /**
   * Update image
   */
  async update(updates) {
    const [updatedImage] = await db('images')
      .where({ id: this.id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');

    return new Image(updatedImage);
  }

  /**
   * Mark image as processed
   */
  async markAsProcessed() {
    return this.update({
      is_processed: true
    });
  }

  /**
   * Update image metadata
   */
  async updateMetadata(metadata) {
    return this.update({
      metadata: JSON.stringify(metadata)
    });
  }

  /**
   * Delete image
   */
  async delete() {
    await db('images')
      .where({ id: this.id })
      .del();
  }

  /**
   * Get image URL (CDN or S3)
   */
  getUrl() {
    if (this.cdn_url) {
      return this.cdn_url;
    }
    
    if (this.s3_key && this.s3_bucket) {
      return `https://${this.s3_bucket}.s3.amazonaws.com/${this.s3_key}`;
    }
    
    return this.file_path;
  }

  /**
   * Get public image data
   */
  toPublicJSON() {
    return {
      id: this.id,
      original_filename: this.original_filename,
      mime_type: this.mime_type,
      file_size: this.file_size,
      width: this.width,
      height: this.height,
      url: this.getUrl(),
      is_processed: this.is_processed,
      created_at: this.created_at
    };
  }

  /**
   * Get full image data (for internal use)
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      original_filename: this.original_filename,
      stored_filename: this.stored_filename,
      file_path: this.file_path,
      s3_key: this.s3_key,
      s3_bucket: this.s3_bucket,
      cdn_url: this.cdn_url,
      mime_type: this.mime_type,
      file_size: this.file_size,
      width: this.width,
      height: this.height,
      metadata: this.metadata ? JSON.parse(this.metadata) : null,
      is_processed: this.is_processed,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Image;
