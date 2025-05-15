import torch
import json
from pathlib import Path
import logging
import traceback
import numpy as np
from typing import List, Dict, Any, Union, Optional
from PIL import Image
from io import BytesIO
from ..services.clip_service import clip_service
from ..core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Core service for managing embeddings and providing vector search functionality"""
    
    def __init__(self):
        self.embeddings_dir = Path(settings.embeddings_dir)
        self.embeddings = None
        self.item_ids = None
        self.metadata = None
        self.normalized_embeddings = None
        self.is_loaded = False
        
    def load_embeddings(self) -> None:
        """Load embeddings from the embeddings directory"""
        if self.is_loaded:
            logger.info("Embeddings already loaded")
            return
            
        try:
            embeddings_path = self.embeddings_dir / "embeddings.npy"
            item_ids_path = self.embeddings_dir / "item_ids.npy"
            metadata_path = self.embeddings_dir / "metadata.json"
            
            logger.info(f"Looking for embeddings at {embeddings_path}")
            logger.info(f"Looking for item IDs at {item_ids_path}")
            logger.info(f"Looking for metadata at {metadata_path}")
            
            if embeddings_path.exists() and item_ids_path.exists() and metadata_path.exists():
                self.embeddings = np.load(embeddings_path)
                self.item_ids = np.load(item_ids_path, allow_pickle=True)
                
                with open(metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                
                logger.info(f"Loaded embeddings array with shape: {self.embeddings.shape}")
                logger.info(f"Loaded {len(self.item_ids)} item IDs")
                logger.info(f"Loaded metadata for {len(self.metadata)} items")
                
                self.normalized_embeddings = torch.from_numpy(self.embeddings).float()
                self.normalized_embeddings = self.normalized_embeddings / self.normalized_embeddings.norm(dim=1, keepdim=True)
                
                # Verify that counts match
                if len(self.item_ids) != self.embeddings.shape[0]:
                    logger.warning(f"Warning: Item IDs count ({len(self.item_ids)}) doesn't match embeddings count ({self.embeddings.shape[0]})")
                
                self.is_loaded = True
                logger.info("Embeddings loaded successfully")
            else:
                if not embeddings_path.exists():
                    logger.warning(f"Embeddings file not found at {embeddings_path}")
                if not item_ids_path.exists():
                    logger.warning(f"Item IDs file not found at {item_ids_path}")
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
        return len(self.item_ids) if self.item_ids is not None else 0
    
    def get_document_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a document by its ID
        
        Args:
            doc_id: The document ID to find
            
        Returns:
            Document dictionary with metadata if found, None otherwise
        """
        if not self.is_loaded:
            self.load_embeddings()
            
        if not self.metadata:
            logger.warning("No metadata loaded, cannot find document")
            return None
        
        if doc_id in self.metadata:
            return {
                "id": doc_id,
                "metadata": self.metadata[doc_id]
            }
        
        try:
            for i, item_id in enumerate(self.item_ids):
                if item_id == doc_id:
                    return {
                        "id": doc_id,
                        "metadata": self.metadata.get(item_id, {})
                    }
        except Exception as e:
            logger.error(f"Error searching for document ID {doc_id}: {str(e)}")
        
        return None
    
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
                
            if self.normalized_embeddings is None or self.item_ids is None or self.metadata is None:
                logger.warning("No embeddings loaded, cannot perform search")
                return []
            
            if isinstance(query_embedding, np.ndarray):
                query_embedding = torch.from_numpy(query_embedding).float()
            
            if query_embedding.dim() == 1:
                query_embedding = query_embedding.unsqueeze(0)
            
            similarities = torch.matmul(self.normalized_embeddings, query_embedding.t()).squeeze()
            
            total_needed = offset + limit
            top_k = min(total_needed, len(similarities))
            top_scores, top_indices = torch.topk(similarities, k=top_k)

            start_idx = min(offset, len(top_indices))
            end_idx = min(offset + limit, len(top_indices))
            
            paginated_indices = top_indices[start_idx:end_idx]
            paginated_scores = top_scores[start_idx:end_idx]
            
            results = []
            
            for idx, score in zip(paginated_indices.cpu().numpy(), paginated_scores.cpu().numpy()):
                idx_int = int(idx)  # Convert tensor/numpy value to int
                if idx_int >= len(self.item_ids):
                    logger.warning(f"Index {idx_int} out of range for item_ids of length {len(self.item_ids)}")
                    continue
                    
                item_id = self.item_ids[idx_int]
                metadata = self.metadata.get(item_id, {})
                
                result = {
                    "id": item_id,
                    "score": float(score),
                    "metadata": metadata
                }
                
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in search: {str(e)}")
            logger.error(traceback.format_exc())
            return []

    def process_image(self, image_file):
        """Process an uploaded image and return its embedding."""
        try:
            position = image_file.tell()
            image_data = image_file.read()

            image_file.seek(position)

            image = Image.open(BytesIO(image_data))
            embedding = clip_service.encode_image(image)
            normalized_embedding = embedding / embedding.norm(dim=-1, keepdim=True)
            
            return normalized_embedding
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise

embedding_service = EmbeddingService()
