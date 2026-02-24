"""
Shared fixtures and configuration for pytest
"""

import sys
from pathlib import Path

import pytest

# Add src directory to path for imports
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


@pytest.fixture(scope="session")
def test_data_dir():
    """Fixture providing path to test data directory"""
    return Path(__file__).parent / "data"


@pytest.fixture(scope="session")
def sample_image_paths(test_data_dir):
    """Fixture providing sample image file paths for testing"""
    return {
        "image1": test_data_dir / "sample1.jpg",
        "image2": test_data_dir / "sample2.jpg",
        "image3": test_data_dir / "sample3.jpg",
    }


@pytest.fixture
def mock_settings():
    """Fixture providing mock settings for testing"""
    from unittest.mock import MagicMock

    settings = MagicMock()
    settings.device = "cpu"
    settings.clip_model = "openai/clip-vit-base-patch32"
    settings.embeddings_dir = "/tmp/test_embeddings"
    settings.raw_data_dir = "/tmp/test_data"
    return settings
