from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pathlib import Path
from PIL import Image
import os

from src.backend.core.config import settings

router = APIRouter(prefix="/api/images", tags=["images"])

THUMBNAIL_DIR = Path(settings.data_dir) / "thumbnails"

@router.get("/{file_path:path}")
async def get_image(
    file_path: str, 
    size: str = Query("full", description="Image size: 'thumbnail' or 'full'")
):
    """
    Serve an image from the raw data directory
    
    Args:
        file_path: Path to the image file
        size: Size of the image to return ('thumbnail' or 'full')
    """
    original_path = Path(settings.raw_data_dir) / file_path
    
    if not original_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    # If full size is requested, return the original image
    if size == "full":
        return FileResponse(original_path)
    
    # For thumbnails, check if we have a cached version
    thumbnail_path = THUMBNAIL_DIR / file_path
    os.makedirs(thumbnail_path.parent, exist_ok=True)
    
    # If thumbnail doesn't exist, create it
    if not thumbnail_path.exists():
        try:
            # Open the original image
            with Image.open(original_path) as img:
                # Calculate new dimensions (max 320px width)
                max_width = 320
                width, height = img.size
                new_height = int(height * (max_width / width))
                
                # Resize the image
                img_thumbnail = img.resize((max_width, new_height), Image.LANCZOS)
                
                # Save the thumbnail
                img_thumbnail.save(thumbnail_path, format=img.format or "JPEG", quality=85)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating thumbnail: {str(e)}")
    
    return FileResponse(thumbnail_path)
