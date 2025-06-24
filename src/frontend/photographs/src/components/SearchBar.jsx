import React, { useState, useEffect } from 'react';
import { getEmbeddingStats } from '../services/api';
import './SearchBar.css';

function SearchBar({ searchQuery, setSearchQuery, onSearch, inputRef, onImageSearch }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [searchMode, setSearchMode] = useState('text'); // 'text' or 'image'
  const [embeddingCount, setEmbeddingCount] = useState(null);

  useEffect(() => {
    const fetchEmbeddingStats = async () => {
      try {
        const stats = await getEmbeddingStats();
        setEmbeddingCount(stats.count);
      } catch (error) {
        console.error('Failed to load embedding stats:', error);
      }
    };

    fetchEmbeddingStats();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchMode === 'text') {
      onSearch(searchQuery);
    } else if (searchMode === 'image' && selectedImage) {
      onImageSearch(selectedImage);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    
    // Create a preview URL for the selected image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (document.getElementById('image-upload')) {
      document.getElementById('image-upload').value = '';
    }
  };

  const switchMode = (mode) => {
    setSearchMode(mode);
    if (mode === 'text') {
      clearImage();
    } else {
      setSearchQuery('');
    }
  };

  return (
    <div className="search-bar">
      <div className="search-mode-selector">
        <button 
          className={`mode-button ${searchMode === 'text' ? 'active' : ''}`}
          onClick={() => switchMode('text')}
          type="button"
        >
          Text Search
        </button>
        <button 
          className={`mode-button ${searchMode === 'image' ? 'active' : ''}`}
          onClick={() => switchMode('image')}
          type="button"
        >
          Image Search
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {searchMode === 'text' ? (
          <>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search historical photographs..."
              className="search-input"
              aria-label="Search photographs"
            />
            <button type="submit" className="search-button">
              <span className="search-icon">🔍</span>
              <span className="search-text">Search</span>
            </button>
          </>
        ) : (
          <div className="image-search-container">
            {!previewUrl ? (
              <div className="image-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="image-upload"
                  className="image-input"
                />
                <label htmlFor="image-upload" className="image-upload-label">
                  <span className="upload-icon">📷</span>
                  <span>Select an image or drag & drop</span>
                </label>
              </div>
            ) : (
              <div className="image-preview-container">
                <img src={previewUrl} alt="Preview" className="image-preview" />
                <button 
                  type="button"
                  className="clear-image-button"
                  onClick={clearImage}
                >
                  ✕
                </button>
              </div>
            )}
            <button 
              type="submit" 
              className="search-button"
              disabled={!selectedImage}
            >
              <span className="search-icon">🔍</span>
              <span className="search-text">Find Similar</span>
            </button>
          </div>
        )}
      </form>

      {searchMode === 'text' && (
        <div className="search-suggestions">
          <p>
            Try searching for: "city streets", "rural landscapes", "women in uniform", or "symbol of capitalization"
          </p>
          {embeddingCount !== null && (
            <p className="embedding-count">
              to discover matches from our collection of {embeddingCount.toLocaleString()} historical photographs
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;