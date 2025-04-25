from fastapi import APIRouter, File, Form, UploadFile, Query
import logging
import traceback

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
    """Search for photographs using text query."""
    logger.info(f"Text search request: query='{query}', limit={limit}, page={page}")
    
    # Calculate offset based on page number and limit
    offset = (page - 1) * limit
    
    try:
        # Add debug information
        logger.info(f"Embedding service loaded: {embedding_service.is_loaded}")
        logger.info(f"Metadata count: {len(embedding_service.metadata) if embedding_service.metadata else 0}")
        
        # Make sure embeddings are loaded
        if not embedding_service.is_loaded:
            embedding_service.load_embeddings()
            
        # Encode the text query using CLIP service
        text_embedding = clip_service.encode_text(query)
        logger.info(f"Text embedding shape: {text_embedding.shape}")
        
        # Search directly with the embedding service
        raw_results = embedding_service.search(text_embedding, limit=limit, offset=offset)
        logger.info(f"Raw results count: {len(raw_results)}")
        
        # Convert the raw results to SearchResult objects
        search_results = [
            SearchResult(
                id=result["id"],
                file_path=result["file_path"],
                file_name=result["file_name"],
                score=result["score"],
                similarity=result.get("similarity", result["score"]),
                metadata=result.get("metadata", {})
            ) for result in raw_results
        ]
        
        logger.info(f"Text search returned {len(search_results)} results")
        return SearchResponse(results=search_results)
    except Exception as e:
        logger.error(f"Error in text search: {str(e)}")
        logger.error(traceback.format_exc())  # Print full traceback
        return SearchResponse(results=[])

@router.post("/image")
async def search_by_image(
    image: UploadFile = File(...),
    resultsPerPage: int = Form(30),
    page: int = Form(1),
):
    """Search for similar images using an uploaded image."""
    logger.info(f"Image search request: filename='{image.filename}', resultsPerPage={resultsPerPage}, page={page}")
    
    # Calculate offset based on page number and limit
    offset = (page - 1) * resultsPerPage
    
    try:
        # Process the image and search directly with the embedding service
        image_embedding = embedding_service.process_image(image.file)
        results = embedding_service.search(image_embedding, limit=resultsPerPage, offset=offset)
        
        logger.info(f"Image search returned {len(results)} results")
        return results
    except Exception as e:
        logger.error(f"Error in image search: {str(e)}")
        return []

@embeddings_router.get("/api/embeddings/count")
async def get_total_embeddings():
    """Return the total number of embeddings."""
    count = embedding_service.get_embedding_count()
    return {"count": count}
