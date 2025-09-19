const express = require('express');
const router = express.Router();
const Image = require('../models/Image');
const { authenticate, checkUsageLimit } = require('../middleware/auth');
const { uploadSingle, validateUploadedFile } = require('../middleware/upload');
const { 
  uploadToS3, 
  generateFileKey, 
  generateCloudFrontUrl,
  formatFileSize,
  deleteFromS3,
  fileExistsInS3,
  getFileMetadata,
  generatePresignedUploadUrl
} = require('../config/aws');
const logger = require('../utils/logger');
const sharp = require('sharp');

/**
 * @route   POST /api/v1/upload/image
 * @desc    Upload a single image
 * @access  Private
 */
router.post('/image', authenticate, checkUsageLimit, uploadSingle, validateUploadedFile, async (req, res) => {
  try {
    const user = req.user;
    const file = req.file;
    
    // Generate unique file key for S3
    const fileKey = generateFileKey(user.id, file.originalname, 'images');
    
    // Get image dimensions using sharp
    let imageMetadata = {};
    try {
      const imageInfo = await sharp(file.buffer).metadata();
      imageMetadata = {
        width: imageInfo.width,
        height: imageInfo.height,
        format: imageInfo.format,
        density: imageInfo.density,
        hasAlpha: imageInfo.hasAlpha,
        channels: imageInfo.channels
      };
    } catch (sharpError) {
      logger.warn('Could not extract image metadata:', sharpError);
    }
    
    // Upload to S3
    const uploadResult = await uploadToS3(file, fileKey);
    
    // Generate CDN URL if configured
    const cdnUrl = generateCloudFrontUrl(fileKey);
    
    // Save image record to database
    const image = await Image.create({
      user_id: user.id,
      original_filename: file.originalname,
      stored_filename: fileKey.split('/').pop(),
      file_path: uploadResult.location,
      s3_key: fileKey,
      s3_bucket: uploadResult.bucket,
      cdn_url: cdnUrl,
      mime_type: file.mimetype,
      file_size: file.size,
      width: imageMetadata.width,
      height: imageMetadata.height,
      metadata: imageMetadata
    });
    
    // Increment user usage
    await user.incrementUsage();
    
    logger.info(`Image uploaded successfully: ${image.id} by user ${user.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        image: image.toPublicJSON(),
        upload_info: {
          file_size: formatFileSize(file.size),
          dimensions: imageMetadata.width && imageMetadata.height 
            ? `${imageMetadata.width}x${imageMetadata.height}` 
            : 'Unknown',
          format: imageMetadata.format || 'Unknown'
        }
      }
    });
  } catch (error) {
    logger.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Image upload failed'
    });
  }
});

/**
 * @route   GET /api/v1/upload/images
 * @desc    Get user's uploaded images
 * @access  Private
 */
router.get('/images', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Get images
    const images = await Image.findByUserId(user.id, limit, offset);
    
    // Get total count for pagination
    const totalCount = await Image.countByUserId(user.id);
    
    res.json({
      success: true,
      data: {
        images: images.map(image => image.toPublicJSON()),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve images'
    });
  }
});

/**
 * @route   GET /api/v1/upload/images/:id
 * @desc    Get specific image details
 * @access  Private
 */
router.get('/images/:id', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const imageId = req.params.id;
    
    const image = await Image.findById(imageId);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    // Check if user owns the image
    if (image.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: {
        image: image.toPublicJSON()
      }
    });
  } catch (error) {
    logger.error('Get image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve image'
    });
  }
});

/**
 * @route   DELETE /api/v1/upload/images/:id
 * @desc    Delete an image
 * @access  Private
 */
router.delete('/images/:id', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const imageId = req.params.id;
    
    const image = await Image.findById(imageId);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
    
    // Check if user owns the image
    if (image.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Delete from S3
    try {
      await deleteFromS3(image.s3_key, image.s3_bucket);
    } catch (s3Error) {
      logger.warn('Failed to delete from S3:', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }
    
    // Delete from database
    await image.delete();
    
    logger.info(`Image deleted: ${imageId} by user ${user.id}`);
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    logger.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image'
    });
  }
});

/**
 * @route   POST /api/v1/upload/presigned-url
 * @desc    Generate presigned URL for direct upload
 * @access  Private
 */
router.post('/presigned-url', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { filename, contentType, fileSize } = req.body;
    
    // Validate input
    if (!filename || !contentType) {
      return res.status(400).json({
        success: false,
        error: 'Filename and content type are required'
      });
    }
    
    // Check file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800;
    if (fileSize && fileSize > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'File too large',
        details: `Maximum file size: ${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }
    
    // Check content type
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/tiff').split(',');
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        details: `Allowed types: ${allowedTypes.join(', ')}`
      });
    }
    
    // Generate file key
    const fileKey = generateFileKey(user.id, filename, 'images');
    
    // Generate presigned URL
    const presignedUrl = generatePresignedUploadUrl(fileKey, contentType);
    
    res.json({
      success: true,
      data: {
        upload_url: presignedUrl,
        file_key: fileKey,
        expires_in: 300 // 5 minutes
      }
    });
  } catch (error) {
    logger.error('Presigned URL generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate presigned URL'
    });
  }
});

/**
 * @route   POST /api/v1/upload/confirm-upload
 * @desc    Confirm successful upload and create image record
 * @access  Private
 */
router.post('/confirm-upload', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { file_key, original_filename, file_size, metadata } = req.body;
    
    // Validate input
    if (!file_key || !original_filename) {
      return res.status(400).json({
        success: false,
        error: 'File key and original filename are required'
      });
    }
    
    // Check if file exists in S3
    const fileExists = await fileExistsInS3(file_key);
    if (!fileExists) {
      return res.status(404).json({
        success: false,
        error: 'File not found in storage'
      });
    }
    
    // Get file metadata from S3
    const s3Metadata = await getFileMetadata(file_key);
    
    // Generate CDN URL if configured
    const cdnUrl = generateCloudFrontUrl(file_key);
    
    // Create image record
    const image = await Image.create({
      user_id: user.id,
      original_filename: original_filename,
      stored_filename: file_key.split('/').pop(),
      file_path: `s3://${process.env.AWS_S3_BUCKET}/${file_key}`,
      s3_key: file_key,
      s3_bucket: process.env.AWS_S3_BUCKET,
      cdn_url: cdnUrl,
      mime_type: s3Metadata.contentType,
      file_size: file_size || s3Metadata.size,
      width: metadata?.width,
      height: metadata?.height,
      metadata: metadata
    });
    
    // Increment user usage
    await user.incrementUsage();
    
    logger.info(`Upload confirmed: ${image.id} by user ${user.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Upload confirmed successfully',
      data: {
        image: image.toPublicJSON()
      }
    });
  } catch (error) {
    logger.error('Upload confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm upload'
    });
  }
});

module.exports = router;
