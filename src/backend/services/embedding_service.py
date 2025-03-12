import torch
import json
from pathlib import Path
import logging
from typing import List, Dict, Tuple, Any, Optional

from ..core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.embeddings_dir = Path(settings.embeddings_dir)
        self.embeddings = None
        self.metadata = None
        self.normalized_embeddings = None
        
    def load_embeddings(self) -> None:
        """Load embeddings from the embeddings directory"""
        try:
            embedding_path = self.embeddings_dir / "embeddings.pt"
            metadata_path = self.embeddings_dir / "metadata.json"
            
            if embedding_path.exists() and metadata_path.exists():
                # Load embeddings and metadata
                self.embeddings = torch.load(embedding_path)
                self.normalized_embeddings = self.embeddings / self.embeddings.norm(dim=-1, keepdim=True)
                
                with open(metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                
                logger.info(f"Loaded {len(self.metadata)} embeddings")
            else:
                logger.warning(f"Embeddings or metadata files not found at {embedding_path} and {metadata_path}")
        except Exception as e:
            logger.error(f"Error loading embeddings: {str(e)}")
    
    def search(self, query_embedding: torch.Tensor, limit: int = 20) -> List[Dict[str, Any]]:
        """Search for similar items using query embedding"""
        if self.normalized_embeddings is None or self.metadata is None:
            logger.warning("No embeddings loaded, cannot perform search")
            return []
        
        # Calculate similarities
        similarities = torch.matmul(self.normalized_embeddings, query_embedding.t())
        
        # Get top results
        top_scores, top_indices = torch.topk(similarities, k=min(limit, len(similarities)))
        
        # Add to results
        results = []
        for idx, score in zip(top_indices.cpu().numpy(), top_scores.cpu().numpy()):
            metadata = self.metadata[idx]
            results.append({
                "id": metadata.get("id", str(idx)),
                "file_path": metadata.get("file_path", ""),
                "file_name": metadata.get("file_name", ""),
                "similarity": float(score),
                "metadata": metadata
            })
        
        return results

# Create a singleton instance
embedding_service = EmbeddingService()
