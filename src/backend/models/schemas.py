from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class SearchResult(BaseModel):
    """Schema for a single search result"""
    id: str
    file_path: str
    file_name: str
    score: float
    similarity: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class SearchResponse(BaseModel):
    """Schema for a search response containing multiple results"""
    results: List[SearchResult]
