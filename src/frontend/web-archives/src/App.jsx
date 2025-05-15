import React, { useState, useRef } from 'react';
import { searchContent } from './services/api';
import SearchBar from './components/SearchBar';
import PDFResultsGrid from './components/PDFResultsGrid';
import './App.css';

const SearchResults = React.memo(({ 
  items, 
  isLoading, 
  hasSearched, 
  error 
}) => {
  if (isLoading) {
    return (
      <div className="loading-indicator">
        <div className="spinner"></div>
        <p>Searching web archives...</p>
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

  if (items.length > 0) {
    return (
      <div className="results-container">
        <PDFResultsGrid items={items} />
      </div>
    );
  }

  if (hasSearched) {
    return (
      <div className="no-results">
        <p>No web archives found. Try a different search query.</p>
      </div>
    );
  }

  return (
    <div className="welcome-message">
      <p>Enter a search term to explore web archives.</p>
      <p>Try searching for subjects, time periods, locations, or visual elements.</p>
    </div>
  );
});

function App() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const searchInputRef = useRef(null);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await searchContent(query);
      setItems(results);
      setHasSearched(true);
    } catch (error) {
      console.error('Error performing search:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Web Archives Explorer</h1>
        <p>Explore web archives using natural language search</p>
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
          items={items}
          isLoading={isLoading}
          hasSearched={hasSearched}
          error={error}
        />
      </main>
    </div>
  );
}

export default App;
