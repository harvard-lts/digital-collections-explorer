import torch
import numpy as np
from PIL import Image
import os
from pathlib import Path
import json
from tqdm import tqdm
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def compute_similarity(query_features, target_features):
    """Compute cosine similarity between query and target features"""
    # Normalize if not already normalized
    if isinstance(query_features, torch.Tensor):
        query_features = query_features.cpu().numpy()
    
    if len(query_features.shape) == 1:
        query_features = query_features.reshape(1, -1)
    
    # Compute dot product (cosine similarity for normalized vectors)
    similarity = np.dot(query_features, target_features.T)
    
    return similarity

def generate_embeddings(model, processor, image_paths, batch_size=32):
    """
    Generate embeddings for a list of image paths
    
    Args:
        model: CLIP model
        processor: Image processor
        image_paths: List of paths to images (can be recursive)
        batch_size: Batch size for processing
        
    Returns:
        numpy.ndarray: Image embeddings
    """
    embeddings = []
    valid_indices = []  # Track indices of valid images
    skipped_images = 0
    
    logger.info(f"Processing {len(image_paths)} images in batches of {batch_size}")
    
    for i in tqdm(range(0, len(image_paths), batch_size), desc="Generating embeddings"):
        batch_paths = image_paths[i:i+batch_size]
        
        # Load and process images
        images = []
        batch_valid_indices = []
        
        for j, path in enumerate(batch_paths):
            try:
                # Ensure path is a string
                path_str = str(path)
                img = Image.open(path_str).convert('RGB')
                
                # Check if image is valid
                if min(img.size) < 10:  # Filter out images that are too small
                    raise ValueError(f"Image too small: {img.size}")
                
                images.append(img)
                batch_valid_indices.append(i + j)
            except Exception as e:
                skipped_images += 1
                if skipped_images <= 10:  # Only show first 10 errors to avoid log flooding
                    logger.warning(f"Error loading image {path}: {e}")
                elif skipped_images == 11:
                    logger.warning("Too many errors, suppressing further error messages...")
        
        # Skip batch if no valid images
        if not images:
            continue
        
        # Process batch
        try:
            image_inputs = processor.process_image(images)
            
            # Generate embeddings
            with torch.no_grad():
                batch_embeddings = model.encode_image(image_inputs)
                batch_embeddings = batch_embeddings / batch_embeddings.norm(dim=-1, keepdim=True)
            
            embeddings.append(batch_embeddings.cpu().numpy())
            valid_indices.extend(batch_valid_indices)
        except Exception as e:
            logger.error(f"Error processing batch: {e}")
            # If batch processing fails, try processing images individually
            for j, img in enumerate(images):
                try:
                    single_input = processor.process_image([img])
                    with torch.no_grad():
                        single_embedding = model.encode_image(single_input)
                        single_embedding = single_embedding / single_embedding.norm(dim=-1, keepdim=True)
                    embeddings.append(single_embedding.cpu().numpy())
                    valid_indices.append(batch_valid_indices[j])
                except Exception as inner_e:
                    logger.warning(f"Error processing individual image: {inner_e}")
    
    if not embeddings:
        logger.error("No valid embeddings generated!")
        return np.array([])
    
    # Concatenate all batches
    all_embeddings = np.vstack(embeddings)
    
    logger.info(f"Generated embeddings for {all_embeddings.shape[0]} images")
    logger.info(f"Skipped {skipped_images} invalid images")
    
    # Return embeddings and valid indices
    return all_embeddings, valid_indices 