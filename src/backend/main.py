from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import json
import os
import sys
from typing import List, Optional, Dict, Any
import numpy as np
from PIL import Image
import io
from pathlib import Path

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.backend.api.search import text_search_handler, image_search_handler, combined_search_handler
from src.backend.utils.config import load_config
from src.models.clip.model import get_clip_model, get_processor
from src.backend.api.config import router as config_router

app = FastAPI(title="Digital Collections Explorer API")

# Load configuration
config = load_config()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Modify this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model and processor
model = None
processor = None

@app.on_event("startup")
async def startup_event():
    global model, processor
    model, processor = get_clip_model(), get_processor()
    
    # Load configuration to determine which frontend to serve
    config = load_config()
    collection_type = config.get("frontend_config", {}).get("collection_type", "photographs")
    
    # Set the frontend directory based on the configured collection type
    frontend_dir = Path(__file__).parent.parent / "frontend" / collection_type / "build"
    
    if not frontend_dir.exists():
        logger.warning(f"Frontend build directory not found: {frontend_dir}")
        logger.warning("Please build the frontend before starting the server.")

@app.get("/")
async def root():
    return {"message": "Digital Collections Explorer API is running"}

@app.get("/api/collections")
async def get_collections():
    """Get available collections"""
    # This would typically come from a database
    collections = [
        {"id": "maps", "name": "Historical Maps", "count": 500},
        {"id": "photos", "name": "Photographs", "count": 1000},
        {"id": "web", "name": "Web Archives", "count": 300}
    ]
    return {"collections": collections}

@app.post("/api/search/text")
async def text_search(
    query: str,
    limit: int = Query(20, ge=1, le=100)
):
    """Search collections using text query"""
    try:
        results = text_search_handler(query, model, processor, limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search/image")
async def image_search(
    image: UploadFile = File(...),
    collection_ids: Optional[List[str]] = Query(None),
    limit: int = Query(20, ge=1, le=100)
):
    """Search collections using image query"""
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))
        results = image_search_handler(img, model, processor, collection_ids, limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search/combined")
async def combined_search(
    image: UploadFile = File(...),
    query: str = Query(...),
    collection_ids: Optional[List[str]] = Query(None),
    limit: int = Query(20, ge=1, le=100)
):
    """Search collections using both image and text query"""
    try:
        contents = await image.read()
        img = Image.open(io.BytesIO(contents))
        results = combined_search_handler(img, query, model, processor, collection_ids, limit)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount static files for the frontend
app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")

# Add this line after creating the app
app.include_router(config_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host=config["api_config"]["host"], 
        port=config["api_config"]["port"], 
        reload=config["api_config"]["debug"]
    ) 