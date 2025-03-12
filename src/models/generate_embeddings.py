import argparse
import json
import numpy as np
from pathlib import Path
from tqdm import tqdm
import glob
import logging
import os

from src.models.clip.model import get_clip_model, get_processor
from src.models.clip.utils import generate_embeddings
from src.backend.utils.config import load_config

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Generate CLIP embeddings for image collections")
    parser.add_argument("--collection", type=str, required=True, help="Collection name/directory")
    parser.add_argument("--config", type=str, default="config.json", help="Path to config file")
    parser.add_argument("--batch_size", type=int, default=None, help="Override batch size from config")
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
    
    # Set batch size
    batch_size = args.batch_size if args.batch_size else config["model_config"]["batch_size"]
    
    # Recursively get all image files
    # Define extensions in lowercase
    image_extensions_base = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']
    # Create case-insensitive patterns
    image_patterns = []
    for ext in image_extensions_base:
        # Add lowercase version
        image_patterns.append(f"*{ext}")
        # Add uppercase version
        image_patterns.append(f"*{ext.upper()}")
    
    image_paths = []
    metadata = []
    
    logger.info(f"Scanning collection directory: {collection_path}")
    
    # Use recursive glob pattern to find all images in all subdirectories with case-insensitive extensions
    for pattern in image_patterns:
        glob_pattern = str(collection_path / f"**/{pattern}")
        found_images = glob.glob(glob_pattern, recursive=True)
        if found_images:
            logger.info(f"Found {len(found_images)} images with pattern {pattern}")
            image_paths.extend(found_images)
    
    # Alternative approach using os.walk for systems where glob might not handle case sensitivity well
    # if not image_paths:
    #     logger.info("No images found with glob patterns, trying alternative method with os.walk")
    #     for root, _, files in os.walk(collection_path):
    #         for file in files:
    #             # Check if file extension (case insensitive) matches any of our image extensions
    #             if any(file.lower().endswith(ext) for ext in image_extensions_base):
    #                 full_path = os.path.join(root, file)
    #                 image_paths.append(full_path)
        
    #     if image_paths:
    #         logger.info(f"Found {len(image_paths)} images using os.walk method")
    
    # Sort paths for consistency
    image_paths.sort()
    
    # Create metadata for each image
    for img_path in image_paths:
        img_path = Path(img_path)
        rel_path = img_path.relative_to(collection_path)
        metadata.append({
            "id": str(rel_path),
            "path": str(rel_path),
            "filename": img_path.name,
            "collection": args.collection,
            # Add subdirectory information
            "subdirectory": str(rel_path.parent) if rel_path.parent != Path('.') else ""
        })
    
    total_images = len(image_paths)
    logger.info(f"Found {total_images} images in collection '{args.collection}' (including all subdirectories)")
    
    if total_images == 0:
        logger.error(f"No images found in {collection_path}. Please check the path and image formats.")
        return
    
    # Generate embeddings
    embeddings, valid_indices = generate_embeddings(
        model, 
        processor, 
        image_paths, 
        batch_size=batch_size
    )
    
    if len(embeddings) == 0:
        logger.error("No valid embeddings generated. Aborting.")
        return
    
    # Keep only metadata for valid images
    valid_metadata = [metadata[i] for i in valid_indices]
    
    # Save embeddings and metadata
    np.save(str(output_dir / f"{args.collection}.npy"), embeddings)
    with open(output_dir / f"{args.collection}_metadata.json", 'w') as f:
        json.dump(valid_metadata, f, indent=2)
    
    logger.info(f"Saved embeddings and metadata for collection '{args.collection}'")
    logger.info(f"Embeddings shape: {embeddings.shape}")
    logger.info(f"Successfully processed {len(valid_metadata)} out of {total_images} images")
    
    # If any images were skipped, save the list of skipped images
    if len(valid_metadata) < total_images:
        skipped_indices = set(range(total_images)) - set(valid_indices)
        skipped_paths = [image_paths[i] for i in skipped_indices]
        with open(output_dir / f"{args.collection}_skipped.json", 'w') as f:
            json.dump(skipped_paths, f, indent=2)
        logger.info(f"Saved list of {len(skipped_paths)} skipped images to {args.collection}_skipped.json")

if __name__ == "__main__":
    main() 