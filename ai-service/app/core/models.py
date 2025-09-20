"""
AI Model Manager for MorphFlux Studio
Handles loading and management of AI models for image transformations
"""

import os
import asyncio
from typing import Dict, Any, Optional, List
import torch
import cv2
import numpy as np
from PIL import Image
import structlog
from app.core.config import settings
from app.core.exceptions import ModelError

logger = structlog.get_logger(__name__)


class ModelManager:
    """Manages AI models for image transformations"""
    
    def __init__(self):
        self.device = self._get_device()
        self.models = {}
        self.model_status = {}
        logger.info("ModelManager initialized", device=self.device)
    
    def _get_device(self) -> str:
        """Get the best available device"""
        if settings.DEVICE == "auto":
            if torch.cuda.is_available():
                return "cuda"
            elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                return "mps"
            else:
                return "cpu"
        return settings.DEVICE
    
    async def load_models(self) -> None:
        """Load all AI models"""
        logger.info("Loading AI models...")
        
        # Load models in parallel
        tasks = [
            self._load_background_removal_model(),
            self._load_style_transfer_model(),
            self._load_face_detection_model(),
            self._load_age_progression_model(),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Log results
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Failed to load model {i}", error=str(result))
            else:
                logger.info(f"Model {i} loaded successfully")
    
    async def _load_background_removal_model(self) -> None:
        """Load background removal model"""
        try:
            # For now, we'll use a simple OpenCV-based approach
            # In production, you'd load a proper AI model like U²-Net
            self.models['background_removal'] = {
                'type': 'opencv',
                'loaded': True,
                'device': self.device
            }
            self.model_status['background_removal'] = 'loaded'
            logger.info("Background removal model loaded")
        except Exception as e:
            self.model_status['background_removal'] = 'failed'
            raise ModelError(f"Failed to load background removal model: {str(e)}")
    
    async def _load_style_transfer_model(self) -> None:
        """Load style transfer model"""
        try:
            # Placeholder for style transfer model
            # In production, you'd load a model like AdaIN or Neural Style Transfer
            self.models['style_transfer'] = {
                'type': 'placeholder',
                'loaded': True,
                'device': self.device
            }
            self.model_status['style_transfer'] = 'loaded'
            logger.info("Style transfer model loaded")
        except Exception as e:
            self.model_status['style_transfer'] = 'failed'
            raise ModelError(f"Failed to load style transfer model: {str(e)}")
    
    async def _load_face_detection_model(self) -> None:
        """Load face detection model"""
        try:
            # Load OpenCV face detection
            face_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(face_cascade_path)
            
            if face_cascade.empty():
                raise ModelError("Failed to load face detection cascade")
            
            self.models['face_detection'] = {
                'type': 'opencv_cascade',
                'model': face_cascade,
                'loaded': True,
                'device': self.device
            }
            self.model_status['face_detection'] = 'loaded'
            logger.info("Face detection model loaded")
        except Exception as e:
            self.model_status['face_detection'] = 'failed'
            raise ModelError(f"Failed to load face detection model: {str(e)}")
    
    async def _load_age_progression_model(self) -> None:
        """Load age progression model"""
        try:
            # Placeholder for age progression model
            # In production, you'd load a model like CAAE or IPCGAN
            self.models['age_progression'] = {
                'type': 'placeholder',
                'loaded': True,
                'device': self.device
            }
            self.model_status['age_progression'] = 'loaded'
            logger.info("Age progression model loaded")
        except Exception as e:
            self.model_status['age_progression'] = 'failed'
            raise ModelError(f"Failed to load age progression model: {str(e)}")
    
    def get_status(self) -> Dict[str, str]:
        """Get status of all models"""
        return self.model_status.copy()
    
    def is_model_loaded(self, model_name: str) -> bool:
        """Check if a model is loaded"""
        return self.model_status.get(model_name) == 'loaded'
    
    async def process_image(
        self, 
        image_path: str, 
        transformation_type: str, 
        parameters: Dict[str, Any]
    ) -> str:
        """Process image with specified transformation"""
        
        if not self.is_model_loaded(transformation_type):
            raise ModelError(f"Model {transformation_type} is not loaded")
        
        logger.info(
            "Processing image",
            transformation_type=transformation_type,
            image_path=image_path
        )
        
        try:
            if transformation_type == 'background_removal':
                return await self._remove_background(image_path, parameters)
            elif transformation_type == 'style_transfer':
                return await self._apply_style_transfer(image_path, parameters)
            elif transformation_type == 'age_progression':
                return await self._apply_age_progression(image_path, parameters)
            elif transformation_type == 'face_enhancement':
                return await self._enhance_face(image_path, parameters)
            else:
                raise ModelError(f"Unknown transformation type: {transformation_type}")
                
        except Exception as e:
            logger.error(
                "Image processing failed",
                transformation_type=transformation_type,
                error=str(e)
            )
            raise ModelError(f"Processing failed: {str(e)}")
    
    async def _remove_background(self, image_path: str, parameters: Dict[str, Any]) -> str:
        """Remove background from image"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ModelError("Failed to load image")
            
            # Simple background removal using GrabCut algorithm
            height, width = image.shape[:2]
            mask = np.zeros((height, width), np.uint8)
            
            # Define rectangle for foreground (center 80% of image)
            margin = 0.1
            rect = (
                int(width * margin),
                int(height * margin),
                int(width * (1 - 2 * margin)),
                int(height * (1 - 2 * margin))
            )
            
            # Initialize background and foreground models
            bgd_model = np.zeros((1, 65), np.float64)
            fgd_model = np.zeros((1, 65), np.float64)
            
            # Apply GrabCut
            cv2.grabCut(image, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
            
            # Create final mask
            mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
            
            # Apply mask to create transparent background
            result = image.copy()
            result = cv2.cvtColor(result, cv2.COLOR_BGR2BGRA)
            result[:, :, 3] = mask2 * 255
            
            # Save result
            output_path = image_path.replace('.', '_bg_removed.')
            cv2.imwrite(output_path, result)
            
            logger.info("Background removal completed", output_path=output_path)
            return output_path
            
        except Exception as e:
            raise ModelError(f"Background removal failed: {str(e)}")
    
    async def _apply_style_transfer(self, image_path: str, parameters: Dict[str, Any]) -> str:
        """Apply style transfer to image"""
        try:
            # For now, implement a simple color adjustment
            # In production, you'd use a proper neural style transfer model
            
            image = cv2.imread(image_path)
            if image is None:
                raise ModelError("Failed to load image")
            
            # Simple style effect - increase saturation and contrast
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            hsv[:, :, 1] = hsv[:, :, 1] * 1.5  # Increase saturation
            hsv[:, :, 1] = np.clip(hsv[:, :, 1], 0, 255)
            
            result = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
            
            # Increase contrast
            result = cv2.convertScaleAbs(result, alpha=1.2, beta=10)
            
            # Save result
            output_path = image_path.replace('.', '_styled.')
            cv2.imwrite(output_path, result)
            
            logger.info("Style transfer completed", output_path=output_path)
            return output_path
            
        except Exception as e:
            raise ModelError(f"Style transfer failed: {str(e)}")
    
    async def _apply_age_progression(self, image_path: str, parameters: Dict[str, Any]) -> str:
        """Apply age progression to image"""
        try:
            # For now, implement a simple aging effect
            # In production, you'd use a proper age progression model
            
            image = cv2.imread(image_path)
            if image is None:
                raise ModelError("Failed to load image")
            
            # Detect faces
            face_cascade = self.models['face_detection']['model']
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) == 0:
                raise ModelError("No faces detected in image")
            
            result = image.copy()
            
            # Apply aging effect to detected faces
            for (x, y, w, h) in faces:
                # Add wrinkles effect (simple noise)
                face_roi = result[y:y+h, x:x+w]
                noise = np.random.normal(0, 10, face_roi.shape).astype(np.uint8)
                face_roi = cv2.add(face_roi, noise)
                
                # Darken the face slightly
                face_roi = cv2.convertScaleAbs(face_roi, alpha=0.9, beta=-5)
                
                result[y:y+h, x:x+w] = face_roi
            
            # Save result
            output_path = image_path.replace('.', '_aged.')
            cv2.imwrite(output_path, result)
            
            logger.info("Age progression completed", output_path=output_path)
            return output_path
            
        except Exception as e:
            raise ModelError(f"Age progression failed: {str(e)}")
    
    async def _enhance_face(self, image_path: str, parameters: Dict[str, Any]) -> str:
        """Enhance face in image"""
        try:
            image = cv2.imread(image_path)
            if image is None:
                raise ModelError("Failed to load image")
            
            # Detect faces
            face_cascade = self.models['face_detection']['model']
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) == 0:
                raise ModelError("No faces detected in image")
            
            result = image.copy()
            
            # Enhance each detected face
            for (x, y, w, h) in faces:
                # Apply bilateral filter for skin smoothing
                face_roi = result[y:y+h, x:x+w]
                face_roi = cv2.bilateralFilter(face_roi, 9, 75, 75)
                
                # Increase brightness slightly
                face_roi = cv2.convertScaleAbs(face_roi, alpha=1.1, beta=5)
                
                result[y:y+h, x:x+w] = face_roi
            
            # Save result
            output_path = image_path.replace('.', '_enhanced.')
            cv2.imwrite(output_path, result)
            
            logger.info("Face enhancement completed", output_path=output_path)
            return output_path
            
        except Exception as e:
            raise ModelError(f"Face enhancement failed: {str(e)}")
    
    def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get information about a specific model"""
        if model_name not in self.models:
            raise ModelError(f"Model {model_name} not found")
        
        model = self.models[model_name]
        return {
            'name': model_name,
            'type': model.get('type', 'unknown'),
            'loaded': model.get('loaded', False),
            'device': model.get('device', 'unknown'),
            'status': self.model_status.get(model_name, 'unknown')
        }
