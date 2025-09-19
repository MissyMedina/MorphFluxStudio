# MorphFlux Studio Backend API

A comprehensive Node.js backend API for MorphFlux Studio, providing AI-powered photo transformation services with user management, file upload, and subscription handling.

## 🚀 Features

### ✅ Completed (MVP)
- **Authentication System**: JWT-based auth with email verification and password reset
- **User Management**: Profile management, usage tracking, and account operations
- **File Upload**: AWS S3 integration with image processing and metadata extraction
- **Database**: PostgreSQL with comprehensive schema for users, images, and transformations
- **Security**: Rate limiting, input validation, and secure file handling
- **Logging**: Winston-based logging with structured error handling

### 🔄 In Progress
- Payment integration with Stripe
- AI service integration
- Transformation processing pipeline

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Redis (optional, for caching)
- AWS S3 account
- SMTP email service

## 🛠️ Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Create PostgreSQL database
   createdb morphflux_studio
   
   # Run migrations
   npm run migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=8000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=morphflux_studio
DB_USER=morphflux_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=morphflux-images

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login user | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| POST | `/api/v1/auth/logout` | Logout user | Yes |
| POST | `/api/v1/auth/verify-email` | Verify email address | No |
| POST | `/api/v1/auth/forgot-password` | Request password reset | No |
| POST | `/api/v1/auth/reset-password` | Reset password | No |
| GET | `/api/v1/auth/me` | Get current user | Yes |

### User Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users/profile` | Get user profile | Yes |
| PUT | `/api/v1/users/profile` | Update user profile | Yes |
| POST | `/api/v1/users/change-password` | Change password | Yes |
| GET | `/api/v1/users/usage` | Get usage statistics | Yes |
| GET | `/api/v1/users/activity` | Get activity history | Yes |
| GET | `/api/v1/users/subscription` | Get subscription details | Yes |
| DELETE | `/api/v1/users/account` | Delete account | Yes |

### File Upload Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/upload/image` | Upload single image | Yes |
| GET | `/api/v1/upload/images` | Get user's images | Yes |
| GET | `/api/v1/upload/images/:id` | Get specific image | Yes |
| DELETE | `/api/v1/upload/images/:id` | Delete image | Yes |
| POST | `/api/v1/upload/presigned-url` | Generate presigned URL | Yes |
| POST | `/api/v1/upload/confirm-upload` | Confirm upload | Yes |

## 🗄️ Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password_hash` (String)
- `first_name`, `last_name` (String)
- `email_verified` (Boolean)
- `subscription_tier` (Enum: free, creator, studio, enterprise)
- `monthly_usage`, `monthly_limit` (Integer)
- `stripe_customer_id`, `stripe_subscription_id` (String)
- `created_at`, `updated_at` (Timestamp)

### Images Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `original_filename`, `stored_filename` (String)
- `s3_key`, `s3_bucket` (String)
- `cdn_url` (String)
- `mime_type`, `file_size` (String, Integer)
- `width`, `height` (Integer)
- `metadata` (JSON)
- `created_at`, `updated_at` (Timestamp)

### Transformations Table
- `id` (UUID, Primary Key)
- `user_id`, `input_image_id`, `output_image_id` (UUID, Foreign Keys)
- `type` (Enum: background_removal, age_progression, etc.)
- `status` (Enum: pending, processing, completed, failed)
- `parameters`, `result_metadata` (JSON)
- `processing_time_ms` (Integer)
- `created_at`, `updated_at` (Timestamp)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Configurable request limits per IP
- **Input Validation**: Joi schema validation for all inputs
- **File Validation**: Type and size validation for uploads
- **CORS Protection**: Configurable cross-origin policies
- **Helmet Security**: Security headers middleware

## 📊 Usage Tracking

The system tracks user usage across different subscription tiers:

- **Free**: 10 transformations/month
- **Creator**: 100 transformations/month  
- **Studio**: Unlimited transformations
- **Enterprise**: Unlimited transformations + priority support

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t morphflux-backend .

# Run container
docker run -p 8000:8000 --env-file .env morphflux-backend
```

### Production Considerations
- Use environment-specific configurations
- Set up proper logging and monitoring
- Configure SSL/TLS certificates
- Set up database backups
- Use managed database services
- Configure CDN for static assets

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run migrate` - Run database migrations
- `npm run migrate:rollback` - Rollback migrations
- `npm run seed` - Run database seeds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Status**: MVP Backend Complete ✅  
**Next Phase**: AI Service Integration & Payment Processing
