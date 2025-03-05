import os
import numpy as np
from typing import List, Optional, Dict, Any
from PIL import Image
import json
import pickle
from pathlib import Path

from src.backend.utils.config import load_config
from src.models.clip.utils import compute_similarity

config = load_config()

def load_embeddings(collection_ids=None):
    """Load pre-computed embeddings for the specified collections"""
    embeddings_dir = Path(config["embeddings_dir"])
    
    all_embeddings = {}
    all_metadata = {}
    
    # If no specific collections are requested, load all available
    if not collection_ids:
        embedding_files = list(embeddings_dir.glob("*.npy"))
        collection_ids = [f.stem for f in embedding_files]
    
    for collection_id in collection_ids:
        embedding_path = embeddings_dir / f"{collection_id}.npy"
        metadata_path = embeddings_dir / f"{collection_id}_metadata.json"
        
        if embedding_path.exists() and metadata_path.exists():
            all_embeddings[collection_id] = np.load(str(embedding_path))
            with open(metadata_path, 'r') as f:
                all_metadata[collection_id] = json.load(f)
    
    return all_embeddings, all_metadata

def text_search_handler(query: str, model, processor, collection_ids=None, limit=20):
    """Handle text-based search"""
    # Encode the text query
    text_inputs = processor.process_text([query])
    with torch.no_grad():
        text_features = model.encode_text(text_inputs)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
    
    # Load embeddings
    all_embeddings, all_metadata = load_embeddings(collection_ids)
    
    results = []
    for collection_id, embeddings in all_embeddings.items():
        metadata = all_metadata[collection_id]
        
        # Compute similarities
        similarities = compute_similarity(text_features.cpu().numpy(), embeddings)
        
        # Get top matches
        top_indices = np.argsort(similarities[0])[::-1][:limit]
        
        # Add to results
        for idx in top_indices:
            item_metadata = metadata[idx]
            results.append({
                "collection_id": collection_id,
                "item_id": item_metadata["id"],
                "similarity": float(similarities[0][idx]),
                "metadata": item_metadata
            })
    
    # Sort by similarity across all collections
    results = sorted(results, key=lambda x: x["similarity"], reverse=True)[:limit]
    
    return results

def image_search_handler(image: Image.Image, model, processor, collection_ids=None, limit=20):
    """Handle image-based search"""
    # Encode the image query
    image_inputs = processor.process_image([image])
    with torch.no_grad():
        image_features = model.encode_image(image_inputs)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
    
    # Load embeddings
    all_embeddings, all_metadata = load_embeddings(collection_ids)
    
    results = []
    for collection_id, embeddings in all_embeddings.items():
        metadata = all_metadata[collection_id]
        
        # Compute similarities
        similarities = compute_similarity(image_features.cpu().numpy(), embeddings)
        
        # Get top matches
        top_indices = np.argsort(similarities[0])[::-1][:limit]
        
        # Add to results
        for idx in top_indices:
            item_metadata = metadata[idx]
            results.append({
                "collection_id": collection_id,
                "item_id": item_metadata["id"],
                "similarity": float(similarities[0][idx]),
                "metadata": item_metadata
            })
    
    # Sort by similarity across all collections
    results = sorted(results, key=lambda x: x["similarity"], reverse=True)[:limit]
    
    return results

def combined_search_handler(image: Image.Image, query: str, model, processor, collection_ids=None, limit=20):
    """Handle combined image and text search"""
    # Encode the image query
    image_inputs = processor.process_image([image])
    with torch.no_grad():
        image_features = model.encode_image(image_inputs)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)
    
    # Encode the text query
    text_inputs = processor.process_text([query])
    with torch.no_grad():
        text_features = model.encode_text(text_inputs)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
    
    # Combine features (simple average)
    combined_features = (image_features + text_features) / 2
    combined_features = combined_features / combined_features.norm(dim=-1, keepdim=True)
    
    # Load embeddings
    all_embeddings, all_metadata = load_embeddings(collection_ids)
    
    results = []
    for collection_id, embeddings in all_embeddings.items():
        metadata = all_metadata[collection_id]
        
        # Compute similarities
        similarities = compute_similarity(combined_features.cpu().numpy(), embeddings)
        
        # Get top matches
        top_indices = np.argsort(similarities[0])[::-1][:limit]
        
        # Add to results
        for idx in top_indices:
            item_metadata = metadata[idx]
            results.append({
                "collection_id": collection_id,
                "item_id": item_metadata["id"],
                "similarity": float(similarities[0][idx]),
                "metadata": item_metadata
            })
    
    # Sort by similarity across all collections
    results = sorted(results, key=lambda x: x["similarity"], reverse=True)[:limit]
    
    return results 