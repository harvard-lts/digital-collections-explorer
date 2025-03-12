import os
import json
from fastapi import APIRouter, HTTPException
from pathlib import Path

router = APIRouter()

@router.get("/api/config")
async def get_config():
    """Get the explorer configuration"""
    try:
        # Look for config.json file in the project root
        config_path = Path(__file__).parent.parent.parent.parent / "config.json"
        
        if config_path.exists():
            with open(config_path, 'r') as f:
                full_config = json.load(f)
            
            # Extract only the frontend-relevant configuration
            frontend_config = full_config.get("frontend_config", {})
            
            # Return a frontend-friendly configuration
            return {
                "collectionType": frontend_config.get("collection_type", "photographs"),
                "projectName": "Digital Collections Explorer",
                "port": frontend_config.get("port", 3000)
                # Add any other frontend-relevant configuration here
            }
        else:
            # Return default configuration if file doesn't exist
            return {
                "collectionType": "photographs",
                "projectName": "Digital Collections Explorer",
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading configuration: {str(e)}") 