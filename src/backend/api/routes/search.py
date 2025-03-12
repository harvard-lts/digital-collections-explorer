from fastapi import APIRouter

from ...services.search_service import search_service
from ..models.schemas import SearchResponse, SearchResult

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("/text", response_model=SearchResponse)
async def search_by_text(query: str, limit: int = 10):
    raw_results = search_service.search_by_text(query, limit=limit)
    
    # Convert the raw results to SearchResult objects
    search_results = [
        SearchResult(
            id=result["id"],
            file_path=result["file_path"],
            file_name=result["file_name"],
            score=result["score"]
        ) for result in raw_results
    ]
    
    # Return a SearchResponse object
    return SearchResponse(results=search_results)
