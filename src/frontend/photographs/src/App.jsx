import React, { useState, useCallback, useRef } from 'react';
import { Gallery } from "react-grid-gallery";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import SearchBar from './components/SearchBar';
import PhotoInfo from './components/PhotoInfo';
import './App.css';
import { searchPhotos } from './services/api';

function App() {
  const [photos, setPhotos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);

  // Format search results into the format expected by react-grid-gallery
  const formatPhotosForGallery = (results) => {
    return results.map(result => ({
      src: `/api/images/${result.file_path}?size=full`,
      thumbnail: `/api/images/${result.file_path}?size=thumbnail`,
      thumbnailWidth: 320, // Default width if not available
      thumbnailHeight: 212, // Default height with 3:2 aspect ratio
      width: 800, // Default width for lightbox
      height: 600, // Default height for lightbox
      caption: result.metadata.title || result.file_name || 'Untitled',
      alt: result.metadata.title || 'Historical Photograph',
      tags: [
        { value: `Similarity: ${(result.similarity * 100).toFixed(1)}%`, title: "Similarity" }
      ],
      // Store the original result data for use in the modal
      originalData: result
    }));
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchPhotos(query);
      setPhotos(formatPhotosForGallery(results));
      setHasSearched(true);
    } catch (error) {
      console.error('Error performing search:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchInputRef.current === document.activeElement) {
      handleSearch(searchQuery);
    }
  };

  const openLightbox = useCallback((index) => {
    setCurrentImage(index);
    setViewerIsOpen(true);
  }, []);

  const closeLightbox = () => {
    setCurrentImage(0);
    setViewerIsOpen(false);
  };

  // Custom thumbnail image component for Gallery
  const thumbnailImageComponent = ({ item, imageProps }) => (
    <LazyLoadImage
      alt={imageProps.alt}
      effect="blur"
      src={item.thumbnail}
      height={item.thumbnailHeight}
      width={item.thumbnailWidth}
      style={{ objectFit: 'cover' }}
      className="historical-image"
    />
  );

  // Format photos for the Lightbox component
  const lightboxSlides = photos.map(photo => ({
    src: photo.src,
    alt: photo.alt,
    title: photo.caption,
    description: photo.originalData ? (
      <PhotoInfo photo={photo.originalData} />
    ) : null
  }));

  // Custom overlay for the gallery items
  const customOverlay = (props) => {
    const { item } = props;
    return (
      <div className="custom-overlay">
        <div className="custom-overlay-title">{item.caption}</div>
        {item.tags && item.tags.length > 0 && (
          <div className="custom-overlay-tags">
            {item.tags.map((tag, index) => (
              <span key={index} className="custom-overlay-tag">
                {tag.value}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="App" onKeyDown={handleKeyPress}>
      <header className="App-header">
        <h1>Digital Collections Explorer</h1>
        <p>Explore historical photographs using natural language search</p>
      </header>
      
      <main className="App-main">
        <div className="search-controls">
          <SearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            onSearch={() => handleSearch(searchQuery)}
            inputRef={searchInputRef}
          />
          
          <button 
            className="search-button" 
            onClick={() => handleSearch(searchQuery)}
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Searching historical photographs...</p>
          </div>
        ) : photos.length > 0 ? (
          <div className="gallery-container">
            <Gallery 
              images={photos}
              enableImageSelection={false}
              thumbnailImageComponent={thumbnailImageComponent}
              customOverlay={customOverlay}
              onClick={(index) => openLightbox(index)}
              margin={5}
              rowHeight={180}
            />
            {viewerIsOpen && (
              <Lightbox
                slides={lightboxSlides}
                open={viewerIsOpen}
                index={currentImage}
                close={closeLightbox}
                controller={{ closeOnBackdropClick: true }}
                render={{
                  buttonPrev: photos.length <= 1 ? () => null : undefined,
                  buttonNext: photos.length <= 1 ? () => null : undefined,
                }}
              />
            )}
          </div>
        ) : hasSearched ? (
          <div className="no-results">
            <p>No photographs found. Try a different search query.</p>
          </div>
        ) : (
          <div className="welcome-message">
            <p>Enter a search term to explore historical photographs.</p>
            <p>Try searching for subjects, time periods, locations, or visual elements.</p>
          </div>
        )}
      </main>
      
      <footer className="App-footer">
        <p>
          Digital Collections Explorer - Powered by CLIP embeddings
        </p>
      </footer>
    </div>
  );
}

export default App;
