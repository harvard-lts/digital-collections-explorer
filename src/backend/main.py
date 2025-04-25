from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
from pathlib import Path
import uvicorn
from contextlib import asynccontextmanager

from .core.config import settings
from .services.embedding_service import embedding_service
from .api.routes import search, images

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app):
    logger.info("Initializing services...")
    
    embedding_service.load_embeddings()
    
    logger.info(f"Starting API server on {settings.host}:{settings.port}")
    logger.info(f"Debug mode: {settings.debug}")
    
    yield

app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(search.router)
app.include_router(images.router)
app.include_router(search.embeddings_router)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

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
        "src.backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
