"""
Model management endpoints
"""

from fastapi import APIRouter, Request
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/")
async def list_models(request: Request):
    """List all available models and their status"""
    model_manager = request.app.state.model_manager
    return {
        "models": model_manager.get_status(),
        "device": model_manager.device
    }


@router.get("/{model_name}")
async def get_model_info(model_name: str, request: Request):
    """Get information about a specific model"""
    model_manager = request.app.state.model_manager
    
    try:
        model_info = model_manager.get_model_info(model_name)
        return model_info
    except Exception as e:
        logger.error("Failed to get model info", model_name=model_name, error=str(e))
        return {"error": str(e)}


@router.get("/{model_name}/status")
async def get_model_status(model_name: str, request: Request):
    """Get status of a specific model"""
    model_manager = request.app.state.model_manager
    
    is_loaded = model_manager.is_model_loaded(model_name)
    return {
        "model": model_name,
        "loaded": is_loaded,
        "status": model_manager.model_status.get(model_name, "unknown")
    }
