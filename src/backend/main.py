from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
from pathlib import Path
import uvicorn
from contextlib import asynccontextmanager

from .core.config import settings
from .services.clip_service import clip_service
from .services.embedding_service import embedding_service
from .api.routes import search, images

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app):
    # Startup code
    logger.info("Initializing services...")
    
    # Load embeddings
    embedding_service.load_embeddings()
    
    logger.info(f"Starting API server on {settings.host}:{settings.port}")
    logger.info(f"Debug mode: {settings.debug}")
    
    yield
    
    # Shutdown code
    logger.info("Shutting down...")

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(search.router)
app.include_router(images.router)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# Optionally mount frontend static files
frontend_dir = Path(settings.frontend_dir)
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
    logger.info(f"Serving frontend from {frontend_dir}")
else:
    logger.warning(f"Frontend directory not found at {frontend_dir}")
    logger.warning("The API will run without serving the frontend.")

if __name__ == "__main__":
    import uvicorn
    
    # Run the server
    uvicorn.run(
        "src.backend.main:app",  # Use the full module path
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
