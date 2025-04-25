import torch
import json
from pathlib import Path
import logging
import traceback
import numpy as np
from typing import List, Dict, Tuple, Any, Optional, Union

from ..core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Core service for managing image embeddings and providing vector search functionality"""
    
    def __init__(self):
        self.embeddings_dir = Path(settings.embeddings_dir)
        self.embeddings = None
        self.metadata = None
        self.normalized_embeddings = None
        self.is_loaded = False
        
    def load_embeddings(self) -> None:
        """Load embeddings from the embeddings directory"""
        if self.is_loaded:
            logger.info("Embeddings already loaded")
            return
            
        try:
            embedding_path = self.embeddings_dir / "embeddings.pt"
            metadata_path = self.embeddings_dir / "metadata.json"
            
            logger.info(f"Looking for embeddings at {embedding_path}")
            logger.info(f"Looking for metadata at {metadata_path}")
            
            if embedding_path.exists() and metadata_path.exists():
                # Load embeddings and metadata
                self.embeddings = torch.load(embedding_path)
                logger.info(f"Loaded embeddings tensor with shape: {self.embeddings.shape}")
                
                # Check if embeddings are valid
                if torch.isnan(self.embeddings).any():
                    logger.warning("Warning: NaN values detected in embeddings")
                
                # Normalize embeddings
                self.normalized_embeddings = self.embeddings / self.embeddings.norm(dim=-1, keepdim=True)
                logger.info(f"Normalized embeddings shape: {self.normalized_embeddings.shape}")
                
                with open(metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                
                logger.info(f"Loaded {len(self.metadata)} items in metadata")
                
                # Verify metadata array length matches embeddings
                if len(self.metadata) != self.embeddings.shape[0]:
                    logger.warning(f"Warning: Metadata length ({len(self.metadata)}) doesn't match embeddings count ({self.embeddings.shape[0]})")
                
                self.is_loaded = True
                logger.info("Embeddings loaded successfully")
            else:
                if not embedding_path.exists():
                    logger.warning(f"Embeddings file not found at {embedding_path}")
                if not metadata_path.exists():
                    logger.warning(f"Metadata file not found at {metadata_path}")
                    
                logger.error("Failed to load embeddings: files not found")
        except Exception as e:
            logger.error(f"Error loading embeddings: {str(e)}")
            logger.error(traceback.format_exc())
    
    def get_embedding_count(self) -> int:
        """Get the total number of loaded embeddings"""
        if not self.is_loaded:
            self.load_embeddings()
        return len(self.metadata) if self.metadata else 0
    
    def search(self, query_embedding: Union[torch.Tensor, np.ndarray], limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Search for similar items using query embedding with pagination
        
        Args:
            query_embedding: The embedding vector to search with (PyTorch tensor or NumPy array)
            limit: Maximum number of results to return
            offset: Number of results to skip for pagination
        
        Returns:
            List of search results with metadata and similarity scores
        """
        try:
            if not self.is_loaded:
                logger.info("Embeddings not loaded, loading now...")
                self.load_embeddings()
                
            if self.normalized_embeddings is None or self.metadata is None:
                logger.warning("No embeddings loaded, cannot perform search")
                return []
            
            # Convert query_embedding to PyTorch tensor if it's a NumPy array
            if isinstance(query_embedding, np.ndarray):
                logger.info("Converting NumPy array query embedding to PyTorch tensor")
                query_embedding = torch.from_numpy(query_embedding)
            
            # Ensure query_embedding is 2D (add batch dimension if needed)
            if query_embedding.dim() == 1:
                query_embedding = query_embedding.unsqueeze(0)
                
            logger.info(f"Searching with query embedding shape: {query_embedding.shape}")
            logger.info(f"Normalized embeddings shape: {self.normalized_embeddings.shape}")
            
            # Calculate similarities
            similarities = torch.matmul(self.normalized_embeddings, query_embedding.t()).squeeze()
            logger.info(f"Calculated similarities with shape: {similarities.shape}")
            logger.info(f"Similarity score range: min={torch.min(similarities).item()}, max={torch.max(similarities).item()}")
            
            # Get all top results we need (offset + limit)
            total_needed = offset + limit
            top_k = min(total_needed, len(similarities))
            logger.info(f"Getting top {top_k} results (offset={offset}, limit={limit})")
            
            top_scores, top_indices = torch.topk(similarities, k=top_k)
            logger.info(f"Top scores shape: {top_scores.shape}, Top indices shape: {top_indices.shape}")
            
            # Apply pagination by slicing
            start_idx = min(offset, len(top_indices))
            end_idx = min(offset + limit, len(top_indices))
            logger.info(f"Applying pagination slice from {start_idx} to {end_idx}")
            
            paginated_indices = top_indices[start_idx:end_idx]
            paginated_scores = top_scores[start_idx:end_idx]
            
            # Add to results
            results = []
            logger.info(f"Processing {len(paginated_indices)} paginated results")
            
            for idx, score in zip(paginated_indices.cpu().numpy(), paginated_scores.cpu().numpy()):
                idx_int = int(idx)  # Convert tensor/numpy value to int
                if idx_int >= len(self.metadata):
                    logger.warning(f"Index {idx_int} out of range for metadata of length {len(self.metadata)}")
                    continue
                    
                metadata = self.metadata[idx_int]
                results.append({
                    "id": metadata.get("id", str(idx_int)),
                    "file_path": metadata.get("file_path", ""),
                    "file_name": metadata.get("file_name", ""),
                    "similarity": float(score),
                    "score": float(score),  # Add score field for consistency
                    "metadata": metadata
                })
            
            logger.info(f"Returning {len(results)} search results")
            return results
            
        except Exception as e:
            logger.error(f"Error in search: {str(e)}")
            logger.error(traceback.format_exc())
            return []

    def process_image(self, image_file):
        """Process an uploaded image and return its embedding."""
        try:
            from PIL import Image
            from io import BytesIO
            from ..services.clip_service import clip_service
            
            # Remember the position of the file
            position = image_file.tell()
            
            # Read the image
            image_data = image_file.read()
            
            # Reset the file position for potential future reads
            image_file.seek(position)
            
            # Open the image with PIL
            image = Image.open(BytesIO(image_data))
            
            # Get the embedding
            embedding = clip_service.encode_image(image)
            
            # Normalize the embedding
            normalized_embedding = embedding / embedding.norm(dim=-1, keepdim=True)
            
            return normalized_embedding
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise

# Create a singleton instance
embedding_service = EmbeddingService()
