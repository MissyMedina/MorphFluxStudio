"""
API v1 router configuration
"""

from fastapi import APIRouter
from app.api.v1.endpoints import transformations, health, models

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(transformations.router, prefix="/transformations", tags=["transformations"])
