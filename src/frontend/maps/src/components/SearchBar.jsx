import React from 'react';
import ImageUpload from './ImageUpload';
import './SearchBar.css';

function SearchBar({
  inputRef,
  searchMode,
  setSearchMode,
  searchQuery,
  setSearchQuery,
  uploadedImage,
  setUploadedImage,
  onSearchByText,
  onSearchByImage,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (searchMode === 'text' && searchQuery) {
      onSearchByText(searchQuery);
    } else if (searchMode === 'image' && uploadedImage) {
      onSearchByImage(uploadedImage);
    }
  };

  return (
    <div className="search-bar">
      <div className="search-mode-selector">
        <button 
          className={`mode-button ${searchMode === 'text' ? 'active' : ''}`}
          onClick={() => setSearchMode('text')}
          type="button"
        >
          Text Search
        </button>
        <button 
          className={`mode-button ${searchMode === 'image' ? 'active' : ''}`}
          onClick={() => setSearchMode('image')}
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
              placeholder="Search historical maps..."
              className="search-input"
              aria-label="Search maps"
            />
            <button type="submit" className="search-button">
              <span className="search-icon">🔍</span>
              <span className="search-text">Search</span>
            </button>
          </>
        ) : (
          <div className="image-search-container">
            <ImageUpload 
              uploadedImage={uploadedImage}
              setUploadedImage={setUploadedImage}
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={!uploadedImage}
            >
              <span className="search-icon">🔍</span>
              <span className="search-text">Find Similar</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default SearchBar;
