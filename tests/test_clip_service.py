"""
Tests for the CLIPService class
"""

from unittest.mock import MagicMock, patch

import pytest
import torch
from PIL import Image

from src.backend.services.clip_service import CLIPService


@pytest.fixture
def mock_clip_model():
    """Create a mock CLIP model"""
    model = MagicMock()
    model.eval = MagicMock()
    model.get_text_features = MagicMock(return_value=torch.randn(1, 512))
    model.get_image_features = MagicMock(return_value=torch.randn(1, 512))
    return model


@pytest.fixture
def mock_clip_processor():
    """Create a mock CLIP processor"""
    processor = MagicMock()
    processor.return_value = {
        "input_ids": torch.randint(0, 1000, (1, 77)),
        "attention_mask": torch.ones(1, 77),
    }
    return processor


class TestCLIPServiceInitialization:
    """Test CLIPService initialization"""

    @patch("src.backend.services.clip_service.CLIPModel")
    @patch("src.backend.services.clip_service.CLIPProcessor")
    @patch("src.backend.services.clip_service.torch.cuda.is_available")
    def test_init_with_cpu(
        self, mock_cuda_available, mock_processor_class, mock_model_class
    ):
        """Test initialization with CPU device"""
        mock_cuda_available.return_value = False
        mock_model = MagicMock()
        mock_model.eval = MagicMock()
        mock_model.to = MagicMock(return_value=mock_model)
        mock_model_class.from_pretrained = MagicMock(return_value=mock_model)
        mock_processor_class.from_pretrained = MagicMock()

        service = CLIPService()

        assert service.device == "cpu"
        assert service.model is not None
        assert service.processor is not None

    @patch("src.backend.services.clip_service.CLIPModel")
    @patch("src.backend.services.clip_service.CLIPProcessor")
    @patch("src.backend.services.clip_service.torch.cuda.is_available")
    def test_init_with_cuda_available(
        self, mock_cuda_available, mock_processor_class, mock_model_class
    ):
        """Test initialization when CUDA is available"""
        mock_cuda_available.return_value = True
        mock_model = MagicMock()
        mock_model.eval = MagicMock()
        mock_model.to = MagicMock(return_value=mock_model)
        mock_model_class.from_pretrained = MagicMock(return_value=mock_model)
        mock_processor_class.from_pretrained = MagicMock()

        # Mock settings to use cuda
        with patch("src.backend.services.clip_service.settings") as mock_settings:
            mock_settings.device = "cuda"
            mock_settings.clip_model = "openai/clip-vit-base-patch32"
            service = CLIPService()

            # Device should be set to cuda when available
            assert service.device == "cuda"

    @patch("src.backend.services.clip_service.CLIPModel")
    @patch("src.backend.services.clip_service.CLIPProcessor")
    def test_init_calls_load_model(self, mock_processor_class, mock_model_class):
        """Test that initialization calls load_model"""
        mock_model = MagicMock()
        mock_model.eval = MagicMock()
        mock_model.to = MagicMock(return_value=mock_model)
        mock_model_class.from_pretrained = MagicMock(return_value=mock_model)
        mock_processor_class.from_pretrained = MagicMock()

        service = CLIPService()

        # Verify model and processor were loaded
        mock_model_class.from_pretrained.assert_called_once()
        mock_processor_class.from_pretrained.assert_called_once()


class TestLoadModel:
    """Test model loading"""

    @patch("src.backend.services.clip_service.CLIPModel")
    @patch("src.backend.services.clip_service.CLIPProcessor")
    def test_load_model_success(self, mock_processor_class, mock_model_class):
        """Test successful model loading"""
        mock_model = MagicMock()
        mock_model.eval = MagicMock()
        mock_model.to = MagicMock(return_value=mock_model)
        mock_model_class.from_pretrained = MagicMock(return_value=mock_model)
        mock_processor = MagicMock()
        mock_processor_class.from_pretrained = MagicMock(return_value=mock_processor)

        service = CLIPService()

        assert service.model is not None
        assert service.processor is not None
        mock_model.eval.assert_called_once()

    @patch("src.backend.services.clip_service.CLIPModel")
    @patch("src.backend.services.clip_service.CLIPProcessor")
    def test_load_model_failure(self, mock_processor_class, mock_model_class):
        """Test model loading failure"""
        mock_model_class.from_pretrained = MagicMock(
            side_effect=Exception("Model not found")
        )

        with pytest.raises(Exception, match="Model not found"):
            CLIPService()


class TestEncodeText:
    """Test text encoding"""

    @patch("src.backend.services.clip_service.extract_embeddings")
    @patch("src.backend.services.clip_service.CLIPModel")
    @patch("src.backend.services.clip_service.CLIPProcessor")
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

        service = CLIPService()
        result = service.encode_text(["test text"])

        assert isinstance(result, torch.Tensor)
        mock_processor.assert_called_once()
        mock_model.get_text_features.assert_called_once()

    @patch("src.backend.services.clip_service.extract_embeddings")
    @patch("src.backend.services.clip_service.CLIPModel")
    @patch("src.backend.services.clip_service.CLIPProcessor")
    def test_encode_text_batch(
        self, mock_processor_class, mock_model_class, mock_extract
    ):
        """Test encoding multiple text strings"""
        # Setup mocks
        mock_model = MagicMock()
        mock_model.eval = MagicMock()
        mock_model.to = MagicMock(return_value=mock_model)
        mock_features = torch.randn(2, 512)
        mock_model.get_text_features = MagicMock(return_value=mock_features)
        mock_model_class.from_pretrained = MagicMock(return_value=mock_model)

        mock_processor = MagicMock()
        mock_processor.return_value = {
            "input_ids": torch.randint(0, 1000, (2, 77)),
            "attention_mask": torch.ones(2, 77),
        }
        mock_processor_class.from_pretrained = MagicMock(return_value=mock_processor)

        mock_extract.return_value = mock_features

        service = CLIPService()
        result = service.encode_text(["text 1", "text 2"])

        assert isinstance(result, torch.Tensor)
        assert result.shape[0] == 2  # Batch size of 2

    @patch("src.backend.services.clip_service.extract_embeddings")
    @patch("src.backend.services.clip_service.CLIPModel")
    @patch("src.backend.services.clip_service.CLIPProcessor")
    def test_encode_text_normalization(
        self, mock_processor_class, mock_model_class, mock_extract
    ):
        """Test that text embeddings are normalized"""
        # Setup mocks
        mock_model = MagicMock()
        mock_model.eval = MagicMock()
        mock_model.to = MagicMock(return_value=mock_model)
        mock_features = torch.randn(1, 512) * 10  # Unnormalized features
        mock_model.get_text_features = MagicMock(return_value=mock_features)
        mock_model_class.from_pretrained = MagicMock(return_value=mock_model)

        mock_processor = MagicMock()
        mock_processor.return_value = {
            "input_ids": torch.randint(0, 1000, (1, 77)),
            "attention_mask": torch.ones(1, 77),
        }
        mock_processor_class.from_pretrained = MagicMock(return_value=mock_processor)

        mock_extract.return_value = mock_features

        service = CLIPService()
        result = service.encode_text(["test"])

        # Check that result is on CPU
        assert result.device.type == "cpu"


class TestEncodeImage:
    """Test image encoding"""

    @patch("src.backend.services.clip_service.extract_embeddings")
    @patch("src.backend.services.clip_service.CLIPModel")
    @patch("src.backend.services.clip_service.CLIPProcessor")
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

        service = CLIPService()

        # Create a simple test image
        test_image = Image.new("RGB", (224, 224), color="red")
        result = service.encode_image(test_image)

        assert isinstance(result, torch.Tensor)
        mock_processor.assert_called()
        mock_model.get_image_features.assert_called_once()

    @patch("src.backend.services.clip_service.extract_embeddings")
    @patch("src.backend.services.clip_service.CLIPModel")
    @patch("src.backend.services.clip_service.CLIPProcessor")
    def test_encode_image_normalization(
        self, mock_processor_class, mock_model_class, mock_extract
    ):
        """Test that image embeddings are normalized"""
        # Setup mocks
        mock_model = MagicMock()
        mock_model.eval = MagicMock()
        mock_model.to = MagicMock(return_value=mock_model)
        mock_features = torch.randn(1, 512) * 10  # Unnormalized
        mock_model.get_image_features = MagicMock(return_value=mock_features)
        mock_model_class.from_pretrained = MagicMock(return_value=mock_model)

        mock_processor = MagicMock()
        mock_processor.return_value = {
            "pixel_values": torch.randn(1, 3, 224, 224),
        }
        mock_processor_class.from_pretrained = MagicMock(return_value=mock_processor)

        mock_extract.return_value = mock_features

        service = CLIPService()
        test_image = Image.new("RGB", (224, 224), color="blue")
        result = service.encode_image(test_image)

        # Check that result is on CPU
        assert result.device.type == "cpu"
