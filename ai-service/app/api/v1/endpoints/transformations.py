"""
Image transformation endpoints
"""

import os
import asyncio
import uuid
from typing import Dict, Any
from fastapi import APIRouter, Request, BackgroundTasks, HTTPException, Depends
from pydantic import BaseModel
from app.core.database import get_db, DatabaseManager
from app.core.exceptions import ValidationError, ProcessingError
from app.core.logging import get_logger
from app.core.config import settings

router = APIRouter()
logger = get_logger(__name__)


class TransformationRequest(BaseModel):
    """Request model for image transformation"""
    transformation_id: str
    input_image_path: str
    transformation_type: str
    parameters: Dict[str, Any]


class TransformationResponse(BaseModel):
    """Response model for transformation"""
    transformation_id: str
    status: str
    output_image_path: str = None
    error_message: str = None
    processing_time_ms: int = None


@router.post("/process", response_model=TransformationResponse)
async def process_transformation(
    request: TransformationRequest,
    background_tasks: BackgroundTasks,
    app_request: Request,
    db=Depends(get_db)
):
    """Process an image transformation"""
    
    logger.info(
        "Transformation request received",
        transformation_id=request.transformation_id,
        transformation_type=request.transformation_type
    )
    
    # Validate transformation type
    valid_types = [
        'background_removal',
        'style_transfer', 
        'age_progression',
        'face_enhancement',
        'object_removal',
        'background_replacement'
    ]
    
    if request.transformation_type not in valid_types:
        raise ValidationError(f"Invalid transformation type: {request.transformation_type}")
    
    # Check if input file exists
    if not os.path.exists(request.input_image_path):
        raise ValidationError(f"Input image not found: {request.input_image_path}")
    
    # Update transformation status to processing
    await DatabaseManager.update_transformation_status(
        request.transformation_id, 
        'processing'
    )
    
    # Start background processing
    background_tasks.add_task(
        process_image_background,
        request.transformation_id,
        request.input_image_path,
        request.transformation_type,
        request.parameters,
        app_request.app.state.model_manager
    )
    
    return TransformationResponse(
        transformation_id=request.transformation_id,
        status="processing"
    )


async def process_image_background(
    transformation_id: str,
    input_image_path: str,
    transformation_type: str,
    parameters: Dict[str, Any],
    model_manager
):
    """Background task for processing image transformation"""
    
    start_time = asyncio.get_event_loop().time()
    
    try:
        logger.info(
            "Starting background processing",
            transformation_id=transformation_id,
            transformation_type=transformation_type
        )
        
        # Process the image
        output_image_path = await model_manager.process_image(
            input_image_path,
            transformation_type,
            parameters
        )
        
        # Calculate processing time
        processing_time_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
        
        # Upload output image to S3 (placeholder for now)
        # In production, you'd upload to S3 and get the S3 key
        output_s3_key = f"transformations/{transformation_id}/output.jpg"
        
        # Create output image record in database
        output_image_id = await DatabaseManager.create_output_image(
            user_id="placeholder",  # This should come from the transformation record
            original_filename=f"transformed_{transformation_id}.jpg",
            s3_key=output_s3_key,
            s3_bucket=settings.AWS_S3_BUCKET,
            mime_type="image/jpeg",
            file_size=os.path.getsize(output_image_path),
            metadata={
                "transformation_type": transformation_type,
                "parameters": parameters,
                "processing_time_ms": processing_time_ms
            }
        )
        
        # Update transformation status to completed
        await DatabaseManager.update_transformation_status(
            transformation_id,
            'completed',
            output_image_id=output_image_id,
            processing_time_ms=processing_time_ms
        )
        
        logger.info(
            "Transformation completed successfully",
            transformation_id=transformation_id,
            processing_time_ms=processing_time_ms
        )
        
    except Exception as e:
        processing_time_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
        
        logger.error(
            "Transformation failed",
            transformation_id=transformation_id,
            error=str(e),
            processing_time_ms=processing_time_ms
        )
        
        # Update transformation status to failed
        await DatabaseManager.update_transformation_status(
            transformation_id,
            'failed',
            error_message=str(e)
        )


@router.get("/{transformation_id}/status")
async def get_transformation_status(transformation_id: str, db=Depends(get_db)):
    """Get the status of a transformation"""
    
    try:
        transformation = await DatabaseManager.get_transformation(transformation_id)
        
        if not transformation:
            raise HTTPException(status_code=404, detail="Transformation not found")
        
        return {
            "transformation_id": transformation_id,
            "status": transformation['status'],
            "type": transformation['type'],
            "created_at": transformation['created_at'],
            "started_at": transformation['started_at'],
            "completed_at": transformation['completed_at'],
            "processing_time_ms": transformation['processing_time_ms'],
            "error_message": transformation['error_message'],
            "output_image_id": transformation['output_image_id']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get transformation status", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{transformation_id}/result")
async def get_transformation_result(transformation_id: str, db=Depends(get_db)):
    """Get the result of a completed transformation"""
    
    try:
        transformation = await DatabaseManager.get_transformation(transformation_id)
        
        if not transformation:
            raise HTTPException(status_code=404, detail="Transformation not found")
        
        if transformation['status'] != 'completed':
            return {
                "transformation_id": transformation_id,
                "status": transformation['status'],
                "message": "Transformation not completed yet"
            }
        
        return {
            "transformation_id": transformation_id,
            "status": transformation['status'],
            "output_image_id": transformation['output_image_id'],
            "output_s3_key": transformation['output_s3_key'],
            "processing_time_ms": transformation['processing_time_ms'],
            "result_metadata": transformation['result_metadata']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get transformation result", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/test")
async def test_transformation(
    transformation_type: str,
    parameters: Dict[str, Any] = None,
    app_request: Request = None
):
    """Test endpoint for transformation (development only)"""
    
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not found")
    
    if parameters is None:
        parameters = {}
    
    # Create a test transformation ID
    test_id = str(uuid.uuid4())
    
    # Use a sample image (you'd need to provide one)
    sample_image_path = "sample_image.jpg"
    
    if not os.path.exists(sample_image_path):
        return {
            "error": "Sample image not found. Please provide a sample_image.jpg file for testing."
        }
    
    try:
        model_manager = app_request.app.state.model_manager
        
        # Process the image
        output_path = await model_manager.process_image(
            sample_image_path,
            transformation_type,
            parameters
        )
        
        return {
            "transformation_id": test_id,
            "status": "completed",
            "input_path": sample_image_path,
            "output_path": output_path,
            "transformation_type": transformation_type,
            "parameters": parameters
        }
        
    except Exception as e:
        logger.error("Test transformation failed", error=str(e))
        return {
            "transformation_id": test_id,
            "status": "failed",
            "error": str(e)
        }
