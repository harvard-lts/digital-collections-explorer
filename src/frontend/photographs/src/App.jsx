import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Gallery } from "react-grid-gallery";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import SearchBar from './components/SearchBar';
import PhotoInfo from './components/PhotoInfo';
import './App.css';
import { searchPhotos, searchByImage } from './services/api';

const Pagination = ({ currentPage, setCurrentPage, hasMore, isLoading }) => {
  return (
    <div className="pagination">
      <button 
        className="pagination-button"
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage <= 1 || isLoading}
      >
        Previous
      </button>
      <span>Page {currentPage}</span>
      <button 
        className="pagination-button"
        onClick={() => setCurrentPage(prev => prev + 1)}
        disabled={!hasMore || isLoading}
      >
        Next
      </button>
    </div>
  );
};

const ResultsPerPageDropdown = ({ resultsPerPage, setResultsPerPage, setCurrentPage, isLoading }) => {
  const handleResultsPerPageChange = (e) => {
    setResultsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(1); // Reset to first page when changing results per page
  };

  return (
    <div className="results-per-page">
      <label htmlFor="resultsPerPage">Results per page:</label>
      <select 
        id="resultsPerPage" 
        value={resultsPerPage} 
        onChange={handleResultsPerPageChange}
        className="results-dropdown"
        disabled={isLoading}
      >
        <option value={30}>30</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
  );
};

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
  thumbnailImageComponent,
  currentPage,
  setCurrentPage,
  hasMore,
  searchType,
  resultsPerPage,
  setResultsPerPage
}) => {
  if (isLoading) {
    return (
      <div className="loading-indicator">
        <div className="spinner"></div>
        <p>{searchType === 'text' ? 'Searching historical photographs...' : 'Finding similar images...'}</p>
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
        <Pagination 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          hasMore={hasMore} 
          isLoading={isLoading}
        />
      </div>
    );
  }

  if (hasSearched) {
    return (
      <div className="no-results">
        <p>No photographs found. Try a different search query.</p>
      </div>
    );
  }

  return (
    <div className="welcome-message">
      <p>Enter a search term to explore historical photographs.</p>
      <p>Try searching for subjects, time periods, locations, or visual elements.</p>
      <p>You can also search by uploading a similar image.</p>
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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchType, setSearchType] = useState('text');
  const [hasMore, setHasMore] = useState(false);
  const [resultsPerPage, setResultsPerPage] = useState(30); // Default limit per page with state

  // Format search results into the format expected by react-grid-gallery
  const formatPhotosForGallery = (results) => {
    return results.map(result => ({
      src: `/images/${result.file_path}?size=full`,
      thumbnail: `/images/${result.file_path}?size=thumbnail`,
      thumbnailWidth: 320, // Default width if not available
      thumbnailHeight: 212, // Default height with 3:2 aspect ratio
      width: 800, // Default width for lightbox
      height: 600, // Default height for lightbox
      caption: result.metadata.title || result.file_name || 'Untitled',
      alt: result.metadata.title || '',
      originalData: result,
      customOverlay: (
        <div className="custom-overlay">
          <div className="custom-overlay-title">
            {result.metadata.title || result.file_name || 'Untitled'}
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
    setSearchType('text');
    setSearchQuery(query); // Save the query for pagination
    
    try {
      const results = await searchPhotos(query, resultsPerPage, currentPage);
      setPhotos(formatPhotosForGallery(results));
      setHasSearched(true);
      setHasMore(results.length >= resultsPerPage); // If we got exactly the number requested, assume there might be more
    } catch (error) {
      console.error('Error performing search:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSearch = async (image) => {
    setIsLoading(true);
    setError(null);
    setSearchType('image');
    
    try {
      const results = await searchByImage(image, resultsPerPage, currentPage);
      setPhotos(formatPhotosForGallery(results));
      setHasSearched(true);
      setHasMore(results.length >= resultsPerPage);
    } catch (error) {
      console.error('Error performing image search:', error);
      setError('Image search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to perform search when page changes or results per page changes
  React.useEffect(() => {
    if (hasSearched) {
      if (searchType === 'text' && searchQuery.trim()) {
        handleSearch(searchQuery);
      } else if (searchType === 'image') {
        // We would need to store the current image to re-run the search
        // This would require additional state management which is not implemented here
      }
    }
  }, [currentPage, resultsPerPage]); // Added resultsPerPage dependency

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
        <h1>Digital Collection Explorer</h1>
        <p>Explore historical photographs using natural language search</p>
      </header>
      
      <main className="App-main">
        <div className="search-controls">
          <SearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            onSearch={() => handleSearch(searchQuery)}
            onImageSearch={handleImageSearch}
            inputRef={searchInputRef}
          />
        </div>

        <ResultsPerPageDropdown 
          resultsPerPage={resultsPerPage} 
          setResultsPerPage={setResultsPerPage} 
          setCurrentPage={setCurrentPage} 
          isLoading={isLoading} 
        />

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
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          hasMore={hasMore}
          searchType={searchType}
          resultsPerPage={resultsPerPage}
          setResultsPerPage={setResultsPerPage}
        />
      </main>
    </div>
  );
}

export default App;
