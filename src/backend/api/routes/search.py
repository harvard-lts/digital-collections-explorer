from fastapi import APIRouter, File, Form, UploadFile, Query
import logging

from ...services.embedding_service import embedding_service
from ...services.clip_service import clip_service
from ...models.schemas import SearchResponse, SearchResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/search", tags=["search"])
embeddings_router = APIRouter(tags=["embeddings"])

@router.get("/text", response_model=SearchResponse)
async def search_by_text(
    query: str, 
    limit: int = Query(30, description="Number of results per page"),
    page: int = Query(1, description="Page number for pagination")
):
    """Search for content using text query."""
    offset = (page - 1) * limit
    
    try:
        if not embedding_service.is_loaded:
            embedding_service.load_embeddings()
        
        text_embedding = clip_service.encode_text(query)
        raw_results = embedding_service.search(text_embedding, limit=limit, offset=offset)
        
        search_results = [
            SearchResult(
                id=result["id"],
                score=result["score"],
                metadata=result["metadata"]
            ) for result in raw_results
        ]
        return SearchResponse(results=search_results)
    except Exception as e:
        logger.error(f"Error in text search: {str(e)}")
        return SearchResponse(results=[])

@router.post("/image")
async def search_by_image(
    image: UploadFile = File(...),
    resultsPerPage: int = Form(30),
    page: int = Form(1),
):
    """Search for similar content using an uploaded image."""
    offset = (page - 1) * resultsPerPage
    
    try:
        image_embedding = embedding_service.process_image(image.file)
        raw_results = embedding_service.search(image_embedding, limit=resultsPerPage, offset=offset)
        
        search_results = [
            SearchResult(
                id=result["id"],
                score=result["score"],
                metadata=result["metadata"]
            ) for result in raw_results
        ]
        return SearchResponse(results=search_results)
    except Exception as e:
        logger.error(f"Error in image search: {str(e)}")
        return SearchResponse(results=[])

@embeddings_router.get("/api/embeddings/count")
async def get_total_embeddings():
    """Return the total number of embeddings."""
    count = embedding_service.get_embedding_count()
    return {"count": count}
