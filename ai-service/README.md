# MorphFlux Studio AI Service

A FastAPI-based AI service for image transformations, providing the core AI processing capabilities for MorphFlux Studio.

## 🚀 Features

### ✅ Implemented
- **FastAPI Framework**: Modern, fast web framework with automatic API documentation
- **AI Model Management**: Dynamic loading and management of AI models
- **Image Processing**: Core transformation capabilities including:
  - Background removal using GrabCut algorithm
  - Style transfer with color enhancement
  - Age progression with face detection
  - Face enhancement with bilateral filtering
- **Database Integration**: PostgreSQL integration for transformation tracking
- **Background Processing**: Asynchronous image processing with job queuing
- **Structured Logging**: Comprehensive logging with request tracking
- **Security**: CORS, rate limiting, and security headers
- **Health Monitoring**: Health check endpoints for service monitoring

### 🔄 In Development
- Advanced AI models (U²-Net, StyleGAN, etc.)
- Real-time processing status updates
- Model versioning and A/B testing
- Performance optimization and caching

## 📋 Prerequisites

- Python 3.9+
- PostgreSQL 13+
- Redis (optional, for caching)
- CUDA-capable GPU (recommended for production)

## 🛠️ Installation

1. **Navigate to AI service directory**
   ```bash
   cd ai-service
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Start the service**
   ```bash
   python main.py
   ```

## 🔧 Configuration

### Environment Variables

```env
# Application
DEBUG=true
HOST=0.0.0.0
PORT=8001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/morphflux_studio

# AI Models
DEVICE=auto  # auto, cpu, cuda, mps
MODEL_CACHE_DIR=models

# Processing
MAX_CONCURRENT_JOBS=4
JOB_TIMEOUT=300
```

## 📚 API Documentation

### Base URL
```
http://localhost:8001
```

### Endpoints

#### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check with dependencies

#### Models
- `GET /api/v1/models/` - List all models and their status
- `GET /api/v1/models/{model_name}` - Get model information
- `GET /api/v1/models/{model_name}/status` - Get model status

#### Transformations
- `POST /api/v1/transformations/process` - Process image transformation
- `GET /api/v1/transformations/{id}/status` - Get transformation status
- `GET /api/v1/transformations/{id}/result` - Get transformation result
- `POST /api/v1/transformations/test` - Test transformation (development)

### API Documentation
When running in debug mode, visit:
- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

## 🧠 AI Models

### Currently Implemented

#### Background Removal
- **Algorithm**: OpenCV GrabCut
- **Input**: RGB image
- **Output**: RGBA image with transparent background
- **Use Case**: Remove backgrounds from portraits and objects

#### Style Transfer
- **Algorithm**: Color space manipulation
- **Input**: RGB image
- **Output**: Stylized RGB image
- **Use Case**: Apply artistic effects to photos

#### Age Progression
- **Algorithm**: Face detection + noise addition
- **Input**: RGB image with faces
- **Output**: Aged RGB image
- **Use Case**: Simulate aging effects

#### Face Enhancement
- **Algorithm**: Bilateral filtering + brightness adjustment
- **Input**: RGB image with faces
- **Output**: Enhanced RGB image
- **Use Case**: Improve face quality and skin texture

### Future Models
- U²-Net for advanced background removal
- Neural Style Transfer for artistic effects
- CAAE for realistic age progression
- StyleGAN for face generation
- Real-ESRGAN for image super-resolution

## 🔄 Processing Workflow

1. **Request Received**: API receives transformation request
2. **Validation**: Validate input parameters and file existence
3. **Status Update**: Mark transformation as "processing"
4. **Background Processing**: Process image asynchronously
5. **Model Execution**: Apply AI transformation
6. **Output Generation**: Save processed image
7. **Database Update**: Update transformation status and metadata
8. **Completion**: Mark transformation as "completed" or "failed"

## 📊 Monitoring

### Health Checks
- Service health: `GET /health`
- Detailed health: `GET /health/detailed`
- Model status: `GET /api/v1/models/`

### Logging
- Structured JSON logging
- Request/response tracking
- Error monitoring
- Performance metrics

### Metrics (Future)
- Processing time tracking
- Model performance metrics
- Resource utilization
- Error rates

## 🚀 Deployment

### Development
```bash
python main.py
```

### Production
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 4
```

### Docker (Future)
```bash
docker build -t morphflux-ai-service .
docker run -p 8001:8001 morphflux-ai-service
```

## 🧪 Testing

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:8001/health

# Test model status
curl http://localhost:8001/api/v1/models/

# Test transformation (requires sample image)
curl -X POST http://localhost:8001/api/v1/transformations/test \
  -H "Content-Type: application/json" \
  -d '{"transformation_type": "background_removal"}'
```

### Automated Testing (Future)
```bash
pytest tests/
```

## 🔧 Development

### Project Structure
```
ai-service/
├── app/
│   ├── api/v1/endpoints/     # API endpoints
│   ├── core/                 # Core functionality
│   │   ├── config.py         # Configuration
│   │   ├── database.py       # Database connection
│   │   ├── models.py         # AI model management
│   │   └── exceptions.py     # Custom exceptions
│   └── __init__.py
├── main.py                   # Application entry point
├── requirements.txt          # Dependencies
└── README.md                # This file
```

### Adding New Transformations

1. **Add model loading** in `app/core/models.py`
2. **Implement processing** in `ModelManager.process_image()`
3. **Add endpoint** in `app/api/v1/endpoints/transformations.py`
4. **Update validation** for new transformation types

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
- Check the API documentation

---

**Status**: Basic AI Service Complete ✅  
**Next Phase**: Advanced AI Models & Image Processing Pipeline
