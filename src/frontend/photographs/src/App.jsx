import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Gallery } from "react-grid-gallery";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import SearchBar from './components/SearchBar';
import CollectionFilter from './components/CollectionFilter';
import PhotoInfo from './components/PhotoInfo';
import './App.css';

function App() {
  const [photos, setPhotos] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [viewerIsOpen, setViewerIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [projectName, setProjectName] = useState('Historical Photograph Explorer');
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);

  // Fetch configuration and collections on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          setProjectName(data.projectName || 'Historical Photograph Explorer');
        }
      } catch (error) {
        console.error('Error fetching configuration:', error);
      }
    };

    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/collections');
        if (!response.ok) {
          throw new Error(`Failed to fetch collections: ${response.status}`);
        }
        const data = await response.json();
        setCollections(data.collections.filter(c => c.type === 'photographs'));
        
        // Auto-select all photograph collections if none are selected
        if (data.collections.length > 0 && selectedCollections.length === 0) {
          const photoCollectionIds = data.collections
            .filter(c => c.type === 'photographs')
            .map(c => c.id);
          setSelectedCollections(photoCollectionIds);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
        setError('Failed to load collections. Please try refreshing the page.');
      }
    };

    fetchConfig();
    fetchCollections();
  }, []);

  // Format search results into the format expected by react-grid-gallery
  const formatPhotosForGallery = (results) => {
    return results.map(result => ({
      src: `/api/images/${result.collection_id}/${result.metadata.path}`,
      thumbnail: `/api/thumbnails/${result.collection_id}/${result.metadata.path}`,
      thumbnailWidth: result.metadata.width || 320,
      thumbnailHeight: result.metadata.height || 212,
      width: result.metadata.width || 800,
      height: result.metadata.height || 600,
      caption: result.metadata.title || result.metadata.filename || 'Untitled',
      alt: result.metadata.caption || result.metadata.title || 'Historical Photograph',
      tags: [
        { value: `Similarity: ${(result.similarity * 100).toFixed(1)}%`, title: "Similarity" }
      ],
      // Store the original result data for use in the modal
      originalData: result
    }));
  };

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const collectionParam = selectedCollections.length > 0 
        ? `&collection_ids=${selectedCollections.join(',')}` 
        : '';
      
      const response = await fetch(`/api/search/text?query=${encodeURIComponent(query)}${collectionParam}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      const formattedPhotos = formatPhotosForGallery(data.results);
      setPhotos(formattedPhotos);
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
      handleSearch();
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
        <h1>{projectName}</h1>
        <p>Explore historical photographs using natural language search</p>
      </header>
      
      <main className="App-main">
        <div className="search-controls">
          <SearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
            inputRef={searchInputRef}
          />
          
          <CollectionFilter 
            collections={collections}
            selectedCollections={selectedCollections}
            setSelectedCollections={setSelectedCollections}
          />
          
          <button 
            className="search-button" 
            onClick={() => handleSearch()}
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
            <p>No photographs found. Try a different search query or select different collections.</p>
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