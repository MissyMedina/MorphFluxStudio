"""
Database configuration for MorphFlux AI Service
"""

import asyncio
from typing import AsyncGenerator
import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Create base class for models
Base = declarative_base()


async def init_db() -> None:
    """Initialize database connection"""
    try:
        # Test connection
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        logger.info("Database connection established")
    except Exception as e:
        logger.error("Failed to connect to database", error=str(e))
        raise


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error("Database session error", error=str(e))
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_asyncpg_connection() -> asyncpg.Connection:
    """Get direct asyncpg connection for raw queries"""
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL)
        return conn
    except Exception as e:
        logger.error("Failed to create asyncpg connection", error=str(e))
        raise


class DatabaseManager:
    """Database manager for common operations"""
    
    @staticmethod
    async def execute_query(query: str, *args) -> list:
        """Execute a raw SQL query"""
        conn = await get_asyncpg_connection()
        try:
            result = await conn.fetch(query, *args)
            return [dict(row) for row in result]
        finally:
            await conn.close()
    
    @staticmethod
    async def execute_command(command: str, *args) -> str:
        """Execute a SQL command"""
        conn = await get_asyncpg_connection()
        try:
            result = await conn.execute(command, *args)
            return result
        finally:
            await conn.close()
    
    @staticmethod
    async def get_transformation(transformation_id: str) -> dict:
        """Get transformation by ID"""
        query = """
            SELECT t.*, 
                   i1.original_filename as input_filename,
                   i1.s3_key as input_s3_key,
                   i2.original_filename as output_filename,
                   i2.s3_key as output_s3_key
            FROM transformations t
            LEFT JOIN images i1 ON t.input_image_id = i1.id
            LEFT JOIN images i2 ON t.output_image_id = i2.id
            WHERE t.id = $1
        """
        results = await DatabaseManager.execute_query(query, transformation_id)
        return results[0] if results else None
    
    @staticmethod
    async def update_transformation_status(
        transformation_id: str, 
        status: str, 
        output_image_id: str = None,
        error_message: str = None,
        processing_time_ms: int = None
    ) -> None:
        """Update transformation status"""
        if output_image_id:
            command = """
                UPDATE transformations 
                SET status = $2, 
                    output_image_id = $3,
                    completed_at = NOW(),
                    processing_time_ms = $5
                WHERE id = $1
            """
            await DatabaseManager.execute_command(
                command, transformation_id, status, output_image_id, processing_time_ms
            )
        elif error_message:
            command = """
                UPDATE transformations 
                SET status = $2, 
                    error_message = $3,
                    completed_at = NOW()
                WHERE id = $1
            """
            await DatabaseManager.execute_command(
                command, transformation_id, status, error_message
            )
        else:
            command = """
                UPDATE transformations 
                SET status = $2, 
                    started_at = CASE WHEN $2 = 'processing' THEN NOW() ELSE started_at END
                WHERE id = $1
            """
            await DatabaseManager.execute_command(command, transformation_id, status)
    
    @staticmethod
    async def create_output_image(
        user_id: str,
        original_filename: str,
        s3_key: str,
        s3_bucket: str,
        mime_type: str,
        file_size: int,
        width: int = None,
        height: int = None,
        metadata: dict = None
    ) -> str:
        """Create output image record"""
        command = """
            INSERT INTO images (
                user_id, original_filename, stored_filename, file_path,
                s3_key, s3_bucket, mime_type, file_size, width, height, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        """
        stored_filename = s3_key.split('/')[-1]
        file_path = f"s3://{s3_bucket}/{s3_key}"
        
        result = await DatabaseManager.execute_query(
            command, user_id, original_filename, stored_filename, file_path,
            s3_key, s3_bucket, mime_type, file_size, width, height, 
            str(metadata) if metadata else None
        )
        
        return result[0]['id'] if result else None
