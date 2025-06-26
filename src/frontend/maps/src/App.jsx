import React, { useState, useCallback, useRef, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import Lightbox from './components/Lightbox';
import SearchResults from './components/SearchResults';
import { searchByText, searchByImage, getImageUrl, getEmbeddingStats } from './services/api';
import './App.css';

function App() {
  const [photos, setPhotos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);
  const [selectedMap, setSelectedMap] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [searchMode, setSearchMode] = useState('text'); // 'text' or 'image'
  const [embeddingCount, setEmbeddingCount] = useState(null);
  const resultsPerPage = 50;

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
    } else if (searchMode === 'image' && uploadedImage) {
      handleSearchByImage(uploadedImage);
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
      setUploadedImage(null);
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
            uploadedImage={uploadedImage}
            setUploadedImage={setUploadedImage}
            onSearchByText={handleSearchByText}
            onSearchByImage={handleSearchByImage}
          />
        </div>
        {embeddingCount !== null && (
          <p className="embedding-count">
            Total number of maps in the collection: {embeddingCount.toLocaleString()}
          </p>
        )}
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
