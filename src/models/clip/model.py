import torch
import open_clip
from pathlib import Path
import os

from src.backend.utils.config import load_config

config = load_config()

def get_clip_model(model_name=None):
    """Get CLIP model"""
    if model_name is None:
        model_name = config["model_config"]["clip_model"]
    
    # Load pre-trained model
    model, _, _ = open_clip.create_model_and_transforms(model_name)
    
    # Move model to appropriate device
    device = config["model_config"]["device"]
    if device == "cuda" and not torch.cuda.is_available():
        device = "cpu"
        print("CUDA not available, using CPU instead")
    
    model = model.to(device)
    model.eval()  # Set to evaluation mode
    
    return model

def get_processor():
    """Get CLIP processor for text and image inputs"""
    model_name = config["model_config"]["clip_model"]
    _, preprocess, tokenizer = open_clip.create_model_and_transforms(model_name)
    
    class Processor:
        def __init__(self, preprocess, tokenizer):
            self.preprocess = preprocess
            self.tokenizer = tokenizer
            self.device = config["model_config"]["device"]
            if self.device == "cuda" and not torch.cuda.is_available():
                self.device = "cpu"
        
        def process_image(self, images):
            """Process a list of PIL images"""
            processed = torch.stack([self.preprocess(img) for img in images])
            return processed.to(self.device)
        
        def process_text(self, texts):
            """Process a list of text strings"""
            processed = self.tokenizer(texts)
            return processed.to(self.device)
    
    return Processor(preprocess, tokenizer) 