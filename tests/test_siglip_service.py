"""
Tests for the SiglipService class
"""

from unittest.mock import MagicMock, patch

import pytest
import torch
from PIL import Image

from src.backend.services.siglip_service import SiglipService


@pytest.fixture
def mock_siglip_model():
    """Create a mock SigLIP model"""
    model = MagicMock()
    model.eval = MagicMock()
    model.get_text_features = MagicMock(return_value=torch.randn(1, 512))
    model.get_image_features = MagicMock(return_value=torch.randn(1, 512))
    return model


@pytest.fixture
def mock_siglip_processor():
    """Create a mock SigLIP processor"""
    processor = MagicMock()
    processor.return_value = {
        "input_ids": torch.randint(0, 1000, (1, 77)),
        "attention_mask": torch.ones(1, 77),
    }
    return processor


class TestSiglipServiceInitialization:
    """Test SiglipService initialization"""

    @patch("src.backend.services.siglip_service.SiglipModel")
    @patch("src.backend.services.siglip_service.AutoProcessor")
    @patch("src.backend.services.siglip_service.torch.backends.mps.is_available")
    def test_init_with_mps(
        self, mock_mps_available, mock_processor_class, mock_model_class
    ):
        """Test initialization with MPS device"""
        mock_mps_available.return_value = True
        mock_model = MagicMock()
        mock_model.eval = MagicMock()
        mock_model.to = MagicMock(return_value=mock_model)
        mock_model_class.from_pretrained = MagicMock(return_value=mock_model)
        mock_processor_class.from_pretrained = MagicMock()

        service = SiglipService(
            model_name="google/siglip-base-patch16-224", device="mps"
        )

        assert service.device == "mps"
        assert service.model is not None
        assert service.processor is not None
        assert service.get_model_type() == "siglip"


class TestLoadModel:
    """Test model loading"""

    @patch("src.backend.services.siglip_service.SiglipModel")
    @patch("src.backend.services.siglip_service.AutoProcessor")
    def test_load_model_success(self, mock_processor_class, mock_model_class):
        """Test successful model loading"""
        mock_model = MagicMock()
        mock_model.eval = MagicMock()
        mock_model.to = MagicMock(return_value=mock_model)
        mock_model_class.from_pretrained = MagicMock(return_value=mock_model)
        mock_processor = MagicMock()
        mock_processor_class.from_pretrained = MagicMock(return_value=mock_processor)

        service = SiglipService(
            model_name="google/siglip-base-patch16-224", device="cpu"
        )

        assert service.model is not None
        assert service.processor is not None
        mock_model.eval.assert_called_once()


class TestEncodeText:
    """Test text encoding"""

    @patch("src.backend.services.siglip_service.extract_embeddings")
    @patch("src.backend.services.siglip_service.SiglipModel")
    @patch("src.backend.services.siglip_service.AutoProcessor")
    def test_encode_text_single(
        self, mock_processor_class, mock_model_class, mock_extract
    ):
        """Test encoding a single text string"""
        # Setup mocks
        mock_model = MagicMock()
        mock_model.eval = MagicMock()
        mock_model.to = MagicMock(return_value=mock_model)
        mock_features = torch.randn(1, 512)
        mock_model.get_text_features = MagicMock(return_value=mock_features)
        mock_model_class.from_pretrained = MagicMock(return_value=mock_model)

        mock_processor = MagicMock()
        mock_processor.return_value = {
            "input_ids": torch.randint(0, 1000, (1, 77)),
            "attention_mask": torch.ones(1, 77),
        }
        mock_processor_class.from_pretrained = MagicMock(return_value=mock_processor)

        # Mock extract_embeddings to return normalized features
        mock_extract.return_value = mock_features

        service = SiglipService(
            model_name="google/siglip-base-patch16-224", device="cpu"
        )
        result = service.encode_text(["test text"])

        assert isinstance(result, torch.Tensor)
        mock_processor.assert_called_once()
        mock_model.get_text_features.assert_called_once()


class TestEncodeImage:
    """Test image encoding"""

    @patch("src.backend.services.siglip_service.extract_embeddings")
    @patch("src.backend.services.siglip_service.SiglipModel")
    @patch("src.backend.services.siglip_service.AutoProcessor")
    def test_encode_image_single(
        self, mock_processor_class, mock_model_class, mock_extract
    ):
        """Test encoding a single image"""
        # Setup mocks
        mock_model = MagicMock()
        mock_model.eval = MagicMock()
        mock_model.to = MagicMock(return_value=mock_model)
        mock_features = torch.randn(1, 512)
        mock_model.get_image_features = MagicMock(return_value=mock_features)
        mock_model_class.from_pretrained = MagicMock(return_value=mock_model)

        mock_processor = MagicMock()
        mock_processor.return_value = {
            "pixel_values": torch.randn(1, 3, 224, 224),
        }
        mock_processor_class.from_pretrained = MagicMock(return_value=mock_processor)

        mock_extract.return_value = mock_features

        service = SiglipService(
            model_name="google/siglip-base-patch16-224", device="cpu"
        )

        # Create a simple test image
        test_image = Image.new("RGB", (224, 224), color="red")
        result = service.encode_image(test_image)

        assert isinstance(result, torch.Tensor)
        mock_processor.assert_called()
        mock_model.get_image_features.assert_called_once()
