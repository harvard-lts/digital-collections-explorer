import os
import json
import torch
import numpy as np
from pathlib import Path
import logging
from pdf2image import convert_from_path
from PIL import Image
from dataclasses import dataclass
from typing import Dict, Any, List
import PyPDF2

from transformers import CLIPProcessor, CLIPModel
from src.backend.core.config import settings

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ProcessingResult:
    """Class for storing processing results"""
    embeddings: Dict[str, torch.Tensor]
    metadata: Dict[str, Dict[str, Any]]
    skipped_files: int

def resize_image_proportionally(image: Image.Image, max_size: int = 1920) -> Image.Image:
    """Resize an image proportionally if it exceeds the maximum size"""
    width, height = image.size
    
    if width > max_size or height > max_size:
        scale_ratio = min(max_size / width, max_size / height)
        new_width = int(width * scale_ratio)
        new_height = int(height * scale_ratio)
        return image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    return image

def generate_embeddings(model, processor, images, device="cuda"):
    """Generate embeddings for a list of images"""
    try:
        inputs = processor(images=images, return_tensors="pt", padding=True)
        if device != "cpu":
            inputs = {k: v.to(device) for k, v in inputs.items()}
        
        with torch.no_grad():
            embeddings = model.get_image_features(**inputs)
            embeddings = embeddings / embeddings.norm(dim=-1, keepdim=True)
        
        return embeddings.cpu()
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        return None

def process_pdf(file_path, model, processor, device, processed_dir, thumbnails_dir):
    """Process a PDF file and generate embeddings for each page"""
    try:
        file_path = Path(file_path)
        
        try:
            # Check if file exists and is readable
            if not file_path.exists():
                logger.error(f"PDF file does not exist: {file_path}")
                return None
                
            if not os.access(file_path, os.R_OK):
                logger.error(f"PDF file is not readable: {file_path}")
                return None
                
            # Convert PDF to images
            images = convert_from_path(file_path)
        except Exception as e:
            logger.error(f"Error converting PDF to images: {file_path}, error: {e}")
            return None
        
        # Get PDF metadata
        try:
            with open(file_path, 'rb') as f:
                pdf = PyPDF2.PdfReader(f)
                n_pages = len(pdf.pages)
        except Exception as e:
            logger.error(f"Error reading PDF metadata: {file_path}, error: {e}")
            return None
        
        pdf_processed_dir = processed_dir / file_path.stem
        pdf_processed_dir.mkdir(parents=True, exist_ok=True)
        pdf_thumbnails_dir = thumbnails_dir / file_path.stem
        pdf_thumbnails_dir.mkdir(parents=True, exist_ok=True)
        
        # Process each page separately and collect results
        embeddings_list = []
        processed_pages = []
        
        for i, image in enumerate(images):
            try:
                # Create and save thumbnail
                thumbnail = image.copy()
                thumbnail.thumbnail((400, 400), Image.Resampling.LANCZOS)
                thumbnail_path = pdf_thumbnails_dir / f"{i}.jpg"
                thumbnail.save(thumbnail_path, "JPEG", quality=85)
                
                # Save compressed images
                processed_image_path = pdf_processed_dir / f"{i}.jpg"
                processed_image = resize_image_proportionally(image.copy())
                processed_image.save(processed_image_path, "JPEG", quality=90)
                
                # Generate embedding for this page
                page_embedding = generate_embeddings(model, processor, [image], device)
                if page_embedding is not None:
                    embeddings_list.append(page_embedding[0])  # Extract the embedding vector
                    processed_pages.append(i)
                    
                    logger.info(f"Processed page {i+1}/{n_pages} of {file_path.name}")
            except Exception as e:
                logger.error(f"Error processing page {i+1} of {file_path.name}: {e}")
        
        if not embeddings_list:
            logger.warning(f"No valid embeddings generated for {file_path}")
            return None
        
        # Return a list of (item_id, embedding, metadata) tuples
        results = []
        for i, embedding in zip(processed_pages, embeddings_list):
            item_id = f"{file_path.name}_{i}"
            metadata = {
                'file_name': file_path.name,
                'type': 'pdf_page',
                'page': i,
                'n_pages': n_pages,
                'paths': {
                    'original': str(file_path),
                    'processed': str(pdf_processed_dir / f"{i}.jpg"),
                    'thumbnail': str(pdf_thumbnails_dir / f"{i}.jpg")
                }
            }
            results.append((item_id, embedding, metadata))
        
        return results
    except Exception as e:
        logger.error(f"Error processing PDF {file_path}: {e}")
        return None

def process_image(file_path, model, processor, device, processed_dir, thumbnails_dir):
    """Process an image file and generate its embedding"""
    try:
        file_path = Path(file_path)
        image = Image.open(file_path).convert('RGB')
        
        # Create thumbnail
        thumbnail = image.copy()
        thumbnail.thumbnail((400, 400), Image.Resampling.LANCZOS)
        thumbnail_path = thumbnails_dir / f"{file_path.stem}.jpg"
        thumbnail.save(thumbnail_path, "JPEG", quality=85)
        
        # Create compressed image (resized if needed)
        processed_image = resize_image_proportionally(image.copy())
        
        # Create directory structure for processed images
        image_processed_dir = processed_dir / file_path.stem
        image_processed_dir.mkdir(parents=True, exist_ok=True)
        processed_image_path = image_processed_dir / "0.jpg"
        processed_image.save(processed_image_path, "JPEG", quality=90)
        
        # Generate embedding
        embedding = generate_embeddings(model, processor, [image], device)
        if embedding is None:
            return None
        
        # Create metadata
        metadata = {
            'file_name': file_path.name,
            'type': 'image',
            'paths': {
                'original': str(file_path),
                'processed': str(processed_image_path),
                'thumbnail': str(thumbnail_path)
            }
        }
        
        return [(file_path.name, embedding[0], metadata)]
    except Exception as e:
        logger.error(f"Error processing image {file_path}: {e}")
        return None

def process_files(model: Any, 
                 processor: Any, 
                 device: str, 
                 raw_data_dir: Path, 
                 processed_dir: Path,
                 thumbnails_dir: Path) -> ProcessingResult:
    """Process all files in the raw data directory"""
    logger.info(f"Looking for files in {raw_data_dir}")
    
    supported_extensions = {
        'pdf': [],
        'image': ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp']
    }
    
    files = []
    pdf_files = []
    image_files = []
    
    for file_path in raw_data_dir.glob("**/*"):
        if file_path.is_file():
            ext = file_path.suffix.lower().lstrip('.')
            if ext == 'pdf':
                pdf_files.append(file_path)
                files.append(file_path)
            elif ext in supported_extensions['image']:
                image_files.append(file_path)
                files.append(file_path)
    
    logger.info(f"Found {len(files)} files (PDFs: {len(pdf_files)}, Images: {len(image_files)})")
    
    if not files:
        logger.warning(f"No files found in {raw_data_dir}")
        return ProcessingResult({}, {}, 0)
    
    # Process files and generate embeddings
    embeddings = {}
    metadata = {}
    skipped_files = 0
    
    # Process each file
    for file_path in files:
        try:
            if file_path.suffix.lower() == '.pdf':
                results = process_pdf(file_path, model, processor, device, processed_dir, thumbnails_dir)
            else:
                results = process_image(file_path, model, processor, device, processed_dir, thumbnails_dir)
            
            if results:
                for item_id, embedding, metadata_item in results:
                    embeddings[item_id] = embedding
                    metadata[item_id] = metadata_item
            else:
                skipped_files += 1
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
            skipped_files += 1
    
    return ProcessingResult(embeddings, metadata, skipped_files)

def main():
    # Use settings from config
    RAW_DATA_DIR = Path(settings.raw_data_dir)
    EMBEDDINGS_DIR = Path(settings.embeddings_dir)
    PROCESSED_DIR = Path(settings.processed_data_dir)
    THUMBNAILS_DIR = Path(settings.thumbnails_dir)
    MODEL_ID = settings.clip_model
    DEVICE = "cuda" if torch.cuda.is_available() and settings.device == "cuda" else "cpu"
    
    logger.info(f"Using device: {DEVICE}")
    logger.info(f"Loading files from: {RAW_DATA_DIR}")
    logger.info(f"Saving embeddings to: {EMBEDDINGS_DIR}")
    logger.info(f"Saving processed images to: {PROCESSED_DIR}")
    logger.info(f"Saving thumbnails to: {THUMBNAILS_DIR}")
    logger.info(f"Using model: {MODEL_ID}")
    
    # Create directories if they don't exist
    EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load CLIP model and processor
    model = CLIPModel.from_pretrained(MODEL_ID).to(DEVICE)
    processor = CLIPProcessor.from_pretrained(MODEL_ID)
    
    # Process all files
    result = process_files(model, processor, DEVICE, RAW_DATA_DIR, PROCESSED_DIR, THUMBNAILS_DIR)
    
    # Save embeddings and metadata
    embeddings_file = EMBEDDINGS_DIR / "embeddings.pt"
    item_ids_file = EMBEDDINGS_DIR / "item_ids.pt"
    metadata_file = EMBEDDINGS_DIR / "metadata.json"
    
    # Get item IDs and embeddings as arrays
    item_ids = list(result.embeddings.keys())
    embeddings_tensor = torch.stack(list(result.embeddings.values()))
    
    # Save to files
    torch.save(embeddings_tensor, embeddings_file)
    torch.save(item_ids, item_ids_file)
    with open(metadata_file, "w") as f:
        json.dump(result.metadata, f, indent=2)
    
    logger.info(f"Saved {len(item_ids)} embeddings to {embeddings_file}")
    logger.info(f"Saved {len(item_ids)} item IDs to {item_ids_file}")
    logger.info(f"Saved metadata to {metadata_file}")
    logger.info(f"Skipped {result.skipped_files} files")

if __name__ == "__main__":
    main()
