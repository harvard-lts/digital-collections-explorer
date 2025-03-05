import os
import argparse
import json
import numpy as np
from pathlib import Path
from tqdm import tqdm
import torch
from PIL import Image
import glob

from src.models.clip.model import get_clip_model, get_processor
from src.models.clip.utils import generate_embeddings
from src.backend.utils.config import load_config

def main():
    parser = argparse.ArgumentParser(description="Generate CLIP embeddings for image collections")
    parser.add_argument("--collection", type=str, required=True, help="Collection name/directory")
    parser.add_argument("--config", type=str, default="config.json", help="Path to config file")
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    
    # Set up paths
    collection_path = Path(config["raw_data_dir"]) / args.collection
    output_dir = Path(config["embeddings_dir"])
    output_dir.mkdir(exist_ok=True, parents=True)
    
    # Get model and processor
    model = get_clip_model()
    processor = get_processor()
    
    # Get all image files
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']
    image_paths = []
    metadata = []
    
    for ext in image_extensions:
        for img_path in glob.glob(str(collection_path / f"**/*{ext}"), recursive=True):
            img_path = Path(img_path)
            image_paths.append(str(img_path))
            
            # Create metadata for each image
            rel_path = img_path.relative_to(collection_path)
            metadata.append({
                "id": str(rel_path),
                "path": str(rel_path),
                "filename": img_path.name,
                "collection": args.collection
            })
    
    print(f"Found {len(image_paths)} images in collection '{args.collection}'")
    
    # Generate embeddings
    embeddings = generate_embeddings(
        model, 
        processor, 
        image_paths, 
        batch_size=config["model_config"]["batch_size"]
    )
    
    # Save embeddings and metadata
    np.save(str(output_dir / f"{args.collection}.npy"), embeddings)
    with open(output_dir / f"{args.collection}_metadata.json", 'w') as f:
        json.dump(metadata, f)
    
    print(f"Saved embeddings and metadata for collection '{args.collection}'")

if __name__ == "__main__":
    main() 