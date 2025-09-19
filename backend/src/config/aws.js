const AWS = require('aws-sdk');
const logger = require('../utils/logger');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Create S3 instance
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  signatureVersion: 'v4'
});

// Create CloudFront instance
const cloudfront = new AWS.CloudFront({
  apiVersion: '2020-05-31'
});

/**
 * Upload file to S3
 */
async function uploadToS3(file, key, bucket = process.env.AWS_S3_BUCKET) {
  try {
    const uploadParams = {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private', // Private by default for security
      Metadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      }
    };

    const result = await s3.upload(uploadParams).promise();
    logger.info(`File uploaded to S3: ${result.Location}`);
    
    return {
      location: result.Location,
      key: result.Key,
      bucket: result.Bucket,
      etag: result.ETag
    };
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
}

/**
 * Generate presigned URL for file access
 */
function generatePresignedUrl(key, bucket = process.env.AWS_S3_BUCKET, expires = 3600) {
  try {
    const params = {
      Bucket: bucket,
      Key: key,
      Expires: expires
    };

    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    logger.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
}

/**
 * Generate presigned URL for file upload
 */
function generatePresignedUploadUrl(key, contentType, bucket = process.env.AWS_S3_BUCKET, expires = 300) {
  try {
    const params = {
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Expires: expires,
      ACL: 'private'
    };

    return s3.getSignedUrl('putObject', params);
  } catch (error) {
    logger.error('Error generating presigned upload URL:', error);
    throw new Error('Failed to generate presigned upload URL');
  }
}

/**
 * Delete file from S3
 */
async function deleteFromS3(key, bucket = process.env.AWS_S3_BUCKET) {
  try {
    const params = {
      Bucket: bucket,
      Key: key
    };

    await s3.deleteObject(params).promise();
    logger.info(`File deleted from S3: ${key}`);
    
    return true;
  } catch (error) {
    logger.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
}

/**
 * Check if file exists in S3
 */
async function fileExistsInS3(key, bucket = process.env.AWS_S3_BUCKET) {
  try {
    const params = {
      Bucket: bucket,
      Key: key
    };

    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Get file metadata from S3
 */
async function getFileMetadata(key, bucket = process.env.AWS_S3_BUCKET) {
  try {
    const params = {
      Bucket: bucket,
      Key: key
    };

    const result = await s3.headObject(params).promise();
    
    return {
      size: result.ContentLength,
      contentType: result.ContentType,
      lastModified: result.LastModified,
      etag: result.ETag,
      metadata: result.Metadata
    };
  } catch (error) {
    logger.error('Error getting file metadata:', error);
    throw new Error('Failed to get file metadata');
  }
}

/**
 * Generate CloudFront URL
 */
function generateCloudFrontUrl(key) {
  const domain = process.env.AWS_CLOUDFRONT_DOMAIN;
  if (!domain) {
    return null;
  }
  
  return `https://${domain}/${key}`;
}

/**
 * Create CloudFront invalidation
 */
async function createCloudFrontInvalidation(paths) {
  try {
    const distributionId = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;
    if (!distributionId) {
      logger.warn('CloudFront distribution ID not configured');
      return null;
    }

    const params = {
      DistributionId: distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: paths.length,
          Items: paths
        },
        CallerReference: `invalidation-${Date.now()}`
      }
    };

    const result = await cloudfront.createInvalidation(params).promise();
    logger.info(`CloudFront invalidation created: ${result.Invalidation.Id}`);
    
    return result.Invalidation;
  } catch (error) {
    logger.error('Error creating CloudFront invalidation:', error);
    throw new Error('Failed to create CloudFront invalidation');
  }
}

/**
 * Generate unique file key
 */
function generateFileKey(userId, originalName, prefix = 'uploads') {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${prefix}/${userId}/${timestamp}-${randomString}-${sanitizedName}`;
}

/**
 * Get file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  s3,
  cloudfront,
  uploadToS3,
  generatePresignedUrl,
  generatePresignedUploadUrl,
  deleteFromS3,
  fileExistsInS3,
  getFileMetadata,
  generateCloudFrontUrl,
  createCloudFrontInvalidation,
  generateFileKey,
  formatFileSize
};
