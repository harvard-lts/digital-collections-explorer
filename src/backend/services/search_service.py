import os
import json
import torch
import numpy as np
from typing import List, Dict, Any
from src.backend.core.config import settings

class SearchService:
    def __init__(self):
        self.embeddings_dir = settings.embeddings_dir
        self.embeddings = None
        self.metadata = None
        self.load_embeddings()
    
    def load_embeddings(self):
        """Load embeddings and metadata from files."""
        embeddings_file = os.path.join(self.embeddings_dir, "embeddings.pt")
        metadata_file = os.path.join(self.embeddings_dir, "metadata.json")
        
        if not os.path.exists(embeddings_file) or not os.path.exists(metadata_file):
            print(f"Warning: Embeddings or metadata files not found")
            return
        
        # Load embeddings
        self.embeddings = torch.load(embeddings_file)
        
        # Load metadata
        with open(metadata_file, "r") as f:
            self.metadata = json.load(f)
        
        print(f"Loaded {len(self.metadata)} embeddings")
    
    def search_by_text(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for images by text query."""
        if self.embeddings is None or self.metadata is None:
            return []
        
        # Get text embeddings from your CLIP service
        from src.backend.services.clip_service import clip_service
        text_embedding = clip_service.encode_text([query])[0]
        
        # Calculate similarity scores
        text_embedding = torch.tensor(text_embedding).unsqueeze(0)
        similarity_scores = torch.matmul(text_embedding, self.embeddings.T).squeeze(0)
        
        # Get top matches
        top_indices = torch.argsort(similarity_scores, descending=True)[:limit]
        
        # Return results
        results = []
        for idx in top_indices:
            idx = idx.item()
            score = similarity_scores[idx].item()
            metadata = self.metadata[idx]
            
            results.append({
                "id": metadata["id"],
                "file_path": metadata["file_path"],
                "file_name": metadata["file_name"],
                "score": score
            })
        
        return results

# Create an instance of the service
search_service = SearchService()
