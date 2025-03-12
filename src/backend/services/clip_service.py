import torch
from transformers import CLIPProcessor, CLIPModel
from pathlib import Path
import logging

from ..core.config import settings

logger = logging.getLogger(__name__)

class CLIPService:
    def __init__(self):
        self.device = settings.device
        if self.device == "cuda" and not torch.cuda.is_available():
            logger.warning("CUDA not available, using CPU instead")
            self.device = "cpu"
        
        self.model_name = settings.clip_model
        self.model = None
        self.processor = None
        self.load_model()
    
    def load_model(self):
        """Load CLIP model and processor"""
        logger.info(f"Loading CLIP model: {self.model_name}")
        try:
            self.model = CLIPModel.from_pretrained(self.model_name).to(self.device)
            self.processor = CLIPProcessor.from_pretrained(self.model_name)
            self.model.eval()  # Set to evaluation mode
            logger.info(f"CLIP model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading CLIP model: {str(e)}")
            raise
    
    def encode_text(self, texts):
        """
        Encode text inputs using the CLIP model
        
        Args:
            texts: List of text strings to encode
            
        Returns:
            numpy.ndarray: Text embeddings
        """
        text_inputs = self.processor(text=texts, return_tensors="pt", padding=True)
        
        if self.device != "cpu":
            text_inputs = {k: v.to(self.device) for k, v in text_inputs.items()}
        
        with torch.no_grad():
            text_features = self.model.get_text_features(**text_inputs)
            text_features = text_features / text_features.norm(dim=1, keepdim=True)
        
        return text_features.cpu().numpy()
    
    def encode_image(self, image) -> torch.Tensor:
        """Encode image to embedding"""
        with torch.no_grad():
            image_inputs = self.processor(images=image, return_tensors="pt", padding=True)
            image_inputs = {k: v.to(self.device) for k, v in image_inputs.items()}
            image_embeddings = self.model.get_image_features(**image_inputs)
            image_embeddings = image_embeddings / image_embeddings.norm(dim=-1, keepdim=True)
        return image_embeddings
    
    def combine_embeddings(self, text_embedding: torch.Tensor, image_embedding: torch.Tensor, 
                          weight_text: float = 0.5) -> torch.Tensor:
        """Combine text and image embeddings with weighted average"""
        weight_image = 1.0 - weight_text
        combined = weight_text * text_embedding + weight_image * image_embedding
        combined = combined / combined.norm(dim=-1, keepdim=True)
        return combined

# Create a singleton instance
clip_service = CLIPService()
