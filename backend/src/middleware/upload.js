const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/tiff').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800, // 50MB default
    files: 1 // Only allow one file at a time
  }
});

/**
 * Single file upload middleware
 */
const uploadSingle = upload.single('file');

/**
 * Multiple files upload middleware
 */
const uploadMultiple = upload.array('files', 5); // Max 5 files

/**
 * Custom upload middleware with error handling
 */
const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: 'File too large',
            details: `Maximum file size: ${Math.round((parseInt(process.env.MAX_FILE_SIZE) || 52428800) / 1024 / 1024)}MB`
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: 'Too many files',
            details: 'Maximum 5 files allowed'
          });
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            error: 'Unexpected file field',
            details: 'Use "file" as the field name for single upload or "files" for multiple uploads'
          });
        }
        
        logger.error('Multer error:', err);
        return res.status(400).json({
          success: false,
          error: 'File upload error',
          details: err.message
        });
      }
      
      if (err) {
        logger.error('Upload error:', err);
        return res.status(400).json({
          success: false,
          error: 'File upload failed',
          details: err.message
        });
      }
      
      next();
    });
  };
};

/**
 * Validate uploaded file
 */
const validateUploadedFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
      details: 'Please select a file to upload'
    });
  }
  
  // Additional validation
  const file = req.file;
  
  // Check file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800;
  if (file.size > maxSize) {
    return res.status(413).json({
      success: false,
      error: 'File too large',
      details: `Maximum file size: ${Math.round(maxSize / 1024 / 1024)}MB`
    });
  }
  
  // Check file type
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/tiff').split(',');
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      details: `Allowed types: ${allowedTypes.join(', ')}`
    });
  }
  
  // Add file metadata to request
  req.fileMetadata = {
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    buffer: file.buffer,
    fieldname: file.fieldname,
    encoding: file.encoding
  };
  
  next();
};

/**
 * Generate unique filename
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  const basename = path.basename(originalName, extension);
  const sanitizedBasename = basename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${sanitizedBasename}_${timestamp}_${randomString}${extension}`;
};

/**
 * Get file extension from mimetype
 */
const getExtensionFromMimetype = (mimetype) => {
  const extensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/tiff': '.tiff',
    'image/gif': '.gif'
  };
  
  return extensions[mimetype] || '.bin';
};

/**
 * Sanitize filename
 */
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

module.exports = {
  uploadSingle: handleUpload(uploadSingle),
  uploadMultiple: handleUpload(uploadMultiple),
  validateUploadedFile,
  generateUniqueFilename,
  getExtensionFromMimetype,
  sanitizeFilename
};
