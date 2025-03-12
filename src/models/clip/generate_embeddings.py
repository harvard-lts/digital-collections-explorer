import os
import json
import torch
import numpy as np
from pathlib import Path
import argparse
import logging

# Import the utility function
from src.models.clip.utils import generate_embeddings

# Import the settings from your config
from src.backend.core.config import settings

# Import CLIP model and processor
from transformers import CLIPProcessor, CLIPModel

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Generate CLIP embeddings for images")
    parser.add_argument("--batch-size", type=int, default=None, help="Override batch size from config")
    parser.add_argument("--data-dir", type=str, default=None, help="Override raw data directory")
    args = parser.parse_args()
    
    # Use settings from config.json
    RAW_DATA_DIR = args.data_dir if args.data_dir else settings.raw_data_dir
    EMBEDDINGS_DIR = settings.embeddings_dir
    MODEL_ID = settings.clip_model
    BATCH_SIZE = args.batch_size if args.batch_size else settings.batch_size
    DEVICE = "cuda" if torch.cuda.is_available() and settings.device == "cuda" else "cpu"
    
    logger.info(f"Using device: {DEVICE}")
    logger.info(f"Loading images from: {RAW_DATA_DIR}")
    logger.info(f"Saving embeddings to: {EMBEDDINGS_DIR}")
    logger.info(f"Using model: {MODEL_ID}")
    
    # Create embeddings directory if it doesn't exist
    os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
    
    # Load CLIP model and processor
    model = CLIPModel.from_pretrained(MODEL_ID).to(DEVICE)
    processor = CLIPProcessor.from_pretrained(MODEL_ID)
    
    # Get all image files
    image_files = []
    for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
        image_files.extend(list(Path(RAW_DATA_DIR).glob(f"**/{ext}")))
    
    logger.info(f"Found {len(image_files)} images")
    
    # Generate embeddings using the utility function
    all_embeddings, valid_indices = generate_embeddings(
        model=model,
        processor=processor,
        image_paths=image_files,
        batch_size=BATCH_SIZE,
        device=DEVICE
    )
    
    # Create metadata for valid images
    metadata = []
    for i, idx in enumerate(valid_indices):
        file = image_files[idx]
        rel_path = os.path.relpath(file, RAW_DATA_DIR)
        metadata.append({
            "id": str(i),
            "file_path": str(rel_path),
            "file_name": file.name
        })
    
    # Convert numpy array to PyTorch tensor
    all_embeddings_tensor = torch.from_numpy(all_embeddings).float()
    
    # Save embeddings and metadata with fixed names
    embeddings_file = os.path.join(EMBEDDINGS_DIR, "embeddings.pt")
    metadata_file = os.path.join(EMBEDDINGS_DIR, "metadata.json")
    
    torch.save(all_embeddings_tensor, embeddings_file)
    with open(metadata_file, "w") as f:
        json.dump(metadata, f, indent=2)
    
    logger.info(f"Saved {len(metadata)} embeddings to {embeddings_file}")
    logger.info(f"Saved metadata to {metadata_file}")

if __name__ == "__main__":
    main()
