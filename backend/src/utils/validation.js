const Joi = require('joi');

/**
 * User registration validation schema
 */
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  first_name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must be less than 50 characters',
      'any.required': 'First name is required'
    }),
  last_name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must be less than 50 characters',
      'any.required': 'Last name is required'
    })
});

/**
 * User login validation schema
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Password reset request validation schema
 */
const passwordResetRequestSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

/**
 * Password reset validation schema
 */
const passwordResetSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required'
    })
});

/**
 * Email verification validation schema
 */
const emailVerificationSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Verification token is required'
    })
});

/**
 * User profile update validation schema
 */
const profileUpdateSchema = Joi.object({
  first_name: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name must be less than 50 characters'
    }),
  last_name: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name must be less than 50 characters'
    }),
  avatar_url: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Avatar URL must be a valid URL'
    })
});

/**
 * Password change validation schema
 */
const passwordChangeSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  new_password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'New password is required'
    })
});

/**
 * File upload validation schema
 */
const fileUploadSchema = Joi.object({
  file: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/webp', 'image/tiff').required(),
    size: Joi.number().max(parseInt(process.env.MAX_FILE_SIZE) || 52428800).required()
  }).required()
});

/**
 * Transformation request validation schema
 */
const transformationSchema = Joi.object({
  input_image_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Input image ID must be a valid UUID',
      'any.required': 'Input image ID is required'
    }),
  type: Joi.string()
    .valid(
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
    )
    .required()
    .messages({
      'any.only': 'Invalid transformation type',
      'any.required': 'Transformation type is required'
    }),
  parameters: Joi.object()
    .required()
    .messages({
      'any.required': 'Transformation parameters are required'
    })
});

/**
 * Validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    req.body = value;
    next();
  };
};

/**
 * File validation middleware
 */
const validateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/tiff').split(',');
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Allowed types: ' + allowedTypes.join(', ')
    });
  }

  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`
    });
  }

  next();
};

module.exports = {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  emailVerificationSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  fileUploadSchema,
  transformationSchema,
  validate,
  validateFile
};
