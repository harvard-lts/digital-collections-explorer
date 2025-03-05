import torch
import numpy as np
from PIL import Image
import os
from pathlib import Path
import json
from tqdm import tqdm

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
    """Generate embeddings for a list of image paths"""
    embeddings = []
    
    for i in tqdm(range(0, len(image_paths), batch_size)):
        batch_paths = image_paths[i:i+batch_size]
        
        # Load and process images
        images = []
        for path in batch_paths:
            try:
                img = Image.open(path).convert('RGB')
                images.append(img)
            except Exception as e:
                print(f"Error loading image {path}: {e}")
                images.append(Image.new('RGB', (224, 224)))  # Placeholder for failed images
        
        # Process batch
        image_inputs = processor.process_image(images)
        
        # Generate embeddings
        with torch.no_grad():
            batch_embeddings = model.encode_image(image_inputs)
            batch_embeddings = batch_embeddings / batch_embeddings.norm(dim=-1, keepdim=True)
        
        embeddings.append(batch_embeddings.cpu().numpy())
    
    # Concatenate all batches
    all_embeddings = np.vstack(embeddings)
    
    return all_embeddings 