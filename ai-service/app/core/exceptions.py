"""
Custom exceptions for MorphFlux AI Service
"""

from typing import Optional, Dict, Any


class MorphFluxException(Exception):
    """Base exception for MorphFlux AI Service"""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.code = code or "MORPHFLUX_ERROR"
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(MorphFluxException):
    """Validation error"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            code="VALIDATION_ERROR",
            details=details
        )


class FileError(MorphFluxException):
    """File processing error"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            code="FILE_ERROR",
            details=details
        )


class ModelError(MorphFluxException):
    """AI model error"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            code="MODEL_ERROR",
            details=details
        )


class ProcessingError(MorphFluxException):
    """Image processing error"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            code="PROCESSING_ERROR",
            details=details
        )


class AuthenticationError(MorphFluxException):
    """Authentication error"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            status_code=401,
            code="AUTHENTICATION_ERROR"
        )


class AuthorizationError(MorphFluxException):
    """Authorization error"""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(
            message=message,
            status_code=403,
            code="AUTHORIZATION_ERROR"
        )


class NotFoundError(MorphFluxException):
    """Resource not found error"""
    
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            message=message,
            status_code=404,
            code="NOT_FOUND"
        )


class RateLimitError(MorphFluxException):
    """Rate limit exceeded error"""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(
            message=message,
            status_code=429,
            code="RATE_LIMIT_EXCEEDED"
        )


class ServiceUnavailableError(MorphFluxException):
    """Service unavailable error"""
    
    def __init__(self, message: str = "Service temporarily unavailable"):
        super().__init__(
            message=message,
            status_code=503,
            code="SERVICE_UNAVAILABLE"
        )
