import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Gallery } from "react-grid-gallery";
import "yet-another-react-lightbox/styles.css";
import 'react-lazy-load-image-component/src/effects/blur.css';
import SearchBar from './components/SearchBar';
import Lightbox from './components/Lightbox';
import Pagination from './components/Pagination';
import { searchByText, searchByImage, getImageUrl } from './services/api';
import './App.css';

const SearchResults = React.memo(({ 
  photos,
  isLoading,
  error,
  onClick,
  currentPage,
  setCurrentPage,
  hasMore,
}) => {
  if (isLoading) {
    return (
      <div className="loading-indicator">
        <div className="spinner"></div>
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
          onClick={(index) => onClick(index)}
          margin={2}
          rowHeight={180}
          targetRowHeight={200}
          containerWidth={window.innerWidth * 0.95}
        />
        <Pagination 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          hasMore={hasMore} 
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="welcome-message">
      <p>Enter a search term or upload a similar image to explore historical maps.</p>
    </div>
  );
});

function App() {
  const [photos, setPhotos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);
  const [selectedMap, setSelectedMap] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchMode, setSearchMode] = useState('text'); // 'text' or 'image'
  const resultsPerPage = 50;

  const formatPhotosForGallery = (results) => {
    return results.map(result => ({
      src: getImageUrl(result.id, 200),
      width: 200,
      height: 150,
      alt: result.file_name,
      originalData: result
    }));
  };

  const handleSearchByText = async (query) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchByText(query, resultsPerPage, currentPage);
      setPhotos(formatPhotosForGallery(results));
      setHasMore(results.length >= resultsPerPage);
    } catch (error) {
      console.error('Error performing search:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchByImage = async (image) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchByImage(image, resultsPerPage, currentPage);
      setPhotos(formatPhotosForGallery(results));
      setHasMore(results.length >= resultsPerPage);
    } catch (error) {
      console.error('Error performing search:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchMode === 'text' && searchQuery) {
      handleSearchByText(searchQuery);
    } else if (searchMode === 'image' && selectedImage) {
      handleSearchByImage(selectedImage);
    }
  }, [currentPage]);

  const handleLightboxOpened = useCallback((index) => {
    const selectedItem = photos[index].originalData;
    const imageUrl = getImageUrl(selectedItem.id, 1600);

    setSelectedMap(imageUrl);
  }, [photos]);

  const handleLightboxClosed = useCallback(() => {
    setSelectedMap(null);
  }, []);

  const handleSearchModeChanged = useCallback((mode) => {
    setSearchMode(mode);
    setCurrentPage(1);
    setPhotos([]);
    setHasMore(false);

    if (mode === 'text') {
      setSelectedImage(null);
    } else {
      setSearchQuery('');
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Historical Maps Explorer</h1>
        <p>Explore maps using natural language search</p>
      </header>
      
      <main className="App-main">
        <div className="search-controls">
          <SearchBar 
            inputRef={searchInputRef}
            searchMode={searchMode}
            setSearchMode={handleSearchModeChanged}
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            onSearchByText={handleSearchByText}
            onSearchByImage={handleSearchByImage}
          />
        </div>
        <SearchResults 
          photos={photos}
          isLoading={isLoading}
          error={error}
          onClick={handleLightboxOpened}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          hasMore={hasMore}
        />
      </main>

      <Lightbox
        isVisible={!!selectedMap}
        imageUrl={selectedMap}
        onBack={handleLightboxClosed}
      />
    </div>
  );
}

export default App;
