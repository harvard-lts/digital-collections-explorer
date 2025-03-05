import React, { useState, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import ImageUpload from './components/ImageUpload';
import ResultsGrid from './components/ResultsGrid';
import CollectionFilter from './components/CollectionFilter';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState('text'); // 'text', 'image', or 'combined'

  // Fetch available collections on component mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/collections');
        const data = await response.json();
        setCollections(data.collections);
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    };

    fetchCollections();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    
    try {
      let response;
      const collectionParam = selectedCollections.length > 0 
        ? `&collection_ids=${selectedCollections.join(',')}` 
        : '';
      
      if (searchMode === 'text' && searchQuery) {
        // Text-only search
        response = await fetch(`/api/search/text?query=${encodeURIComponent(searchQuery)}${collectionParam}`);
      } else if (searchMode === 'image' && selectedImage) {
        // Image-only search
        const formData = new FormData();
        formData.append('image', selectedImage);
        
        response = await fetch(`/api/search/image?${collectionParam}`, {
          method: 'POST',
          body: formData,
        });
      } else if (searchMode === 'combined' && searchQuery && selectedImage) {
        // Combined search
        const formData = new FormData();
        formData.append('image', selectedImage);
        
        response = await fetch(`/api/search/combined?query=${encodeURIComponent(searchQuery)}${collectionParam}`, {
          method: 'POST',
          body: formData,
        });
      } else {
        console.error('Invalid search parameters');
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      setSearchResults(data.results);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Digital Collections Explorer</h1>
        <p>Search across digital collections using text, images, or both</p>
      </header>
      
      <main className="App-main">
        <div className="search-controls">
          <div className="search-mode-selector">
            <button 
              className={searchMode === 'text' ? 'active' : ''} 
              onClick={() => setSearchMode('text')}
            >
              Text Search
            </button>
            <button 
              className={searchMode === 'image' ? 'active' : ''} 
              onClick={() => setSearchMode('image')}
            >
              Image Search
            </button>
            <button 
              className={searchMode === 'combined' ? 'active' : ''} 
              onClick={() => setSearchMode('combined')}
            >
              Combined Search
            </button>
          </div>
          
          {(searchMode === 'text' || searchMode === 'combined') && (
            <SearchBar 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
            />
          )}
          
          {(searchMode === 'image' || searchMode === 'combined') && (
            <ImageUpload 
              selectedImage={selectedImage} 
              setSelectedImage={setSelectedImage} 
            />
          )}
          
          <CollectionFilter 
            collections={collections}
            selectedCollections={selectedCollections}
            setSelectedCollections={setSelectedCollections}
          />
          
          <button 
            className="search-button" 
            onClick={handleSearch}
            disabled={isLoading || 
              (searchMode === 'text' && !searchQuery) ||
              (searchMode === 'image' && !selectedImage) ||
              (searchMode === 'combined' && (!searchQuery || !selectedImage))
            }
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <ResultsGrid results={searchResults} isLoading={isLoading} />
      </main>
      
      <footer className="App-footer">
        <p>
          Based on research by Mahowald and Lee: 
          <a href="https://arxiv.org/abs/2410.01190" target="_blank" rel="noopener noreferrer">
            Integrating Visual and Textual Inputs for Searching Large-Scale Map Collections with CLIP
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App; 