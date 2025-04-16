import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Gallery } from "react-grid-gallery";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import SearchBar from './components/SearchBar';
import PhotoInfo from './components/PhotoInfo';
import './App.css';
import { searchPhotos } from './services/api';

// Create a new SearchResults component at the top of your file, before the App component
const SearchResults = React.memo(({ 
  photos, 
  isLoading, 
  hasSearched, 
  error, 
  openLightbox, 
  viewerIsOpen, 
  currentImage, 
  closeLightbox, 
  lightboxSlides, 
  thumbnailImageComponent 
}) => {
  if (isLoading) {
    return (
      <div className="loading-indicator">
        <div className="spinner"></div>
        <p>Searching historical maps...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
      </div>
    );
  }

  if (photos.length > 0) {
    return (
      <div className="gallery-container">
        <Gallery 
          images={photos}
          enableImageSelection={false}
          thumbnailImageComponent={thumbnailImageComponent}
          onClick={(index) => openLightbox(index)}
          margin={2}
          rowHeight={180}
          targetRowHeight={200}
          containerWidth={window.innerWidth * 0.95}
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
    );
  }

  if (hasSearched) {
    return (
      <div className="no-results">
        <p>No maps found. Try a different search query.</p>
      </div>
    );
  }

  return (
    <div className="welcome-message">
      <p>Enter a search term to explore historical maps.</p>
      <p>Try searching for subjects, time periods, locations, or visual elements.</p>
    </div>
  );
});

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
      alt: result.metadata.title || 'Historical Map',
      originalData: result,
      customOverlay: (
        <div className="custom-overlay">
          <div className="custom-overlay-title">
            {result.metadata.title || result.file_name || 'Untitled'}
          </div>
          <div className="custom-overlay-similarity">
            Similarity score: {result.similarity.toFixed(3)}
          </div>
        </div>
      )
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

  const openLightbox = useCallback((index) => {
    setCurrentImage(index);
    setViewerIsOpen(true);
  }, []);

  const closeLightbox = () => {
    setCurrentImage(0);
    setViewerIsOpen(false);
  };

  // Custom thumbnail image component for Gallery
  const thumbnailImageComponent = useCallback(({ item, imageProps }) => (
    <LazyLoadImage
      alt={imageProps.alt}
      effect="blur"
      src={item.thumbnail}
      height={item.thumbnailHeight}
      width={item.thumbnailWidth}
      style={{ objectFit: 'cover' }}
      className="historical-image"
      placeholderSrc='https://placehold.co/300x200'
    />
  ), []);

  // Format photos for the Lightbox component
  const lightboxSlides = useMemo(() => photos.map(photo => ({
    src: photo.src,
    alt: photo.alt,
    title: photo.caption,
    description: photo.originalData ? (
      <PhotoInfo photo={photo.originalData} />
    ) : null
  })), [photos]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>My Digital Collections Explorer</h1>
        <p>Explore historical map using natural language search</p>
      </header>
      
      <main className="App-main">
        <div className="search-controls">
          <SearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            onSearch={() => handleSearch(searchQuery)}
            inputRef={searchInputRef}
          />
        </div>

        <SearchResults 
          photos={photos}
          isLoading={isLoading}
          hasSearched={hasSearched}
          error={error}
          openLightbox={openLightbox}
          viewerIsOpen={viewerIsOpen}
          currentImage={currentImage}
          closeLightbox={closeLightbox}
          lightboxSlides={lightboxSlides}
          thumbnailImageComponent={thumbnailImageComponent}
        />
      </main>
    </div>
  );
}

export default App;
