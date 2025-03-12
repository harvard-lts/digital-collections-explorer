from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class SearchResult(BaseModel):
    id: str
    file_path: str
    file_name: str
    score: float

class SearchResponse(BaseModel):
    results: List[SearchResult]
