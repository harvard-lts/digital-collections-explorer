import React from 'react';
import './SearchBar.css';

function SearchBar({ searchQuery, setSearchQuery, onSearch, inputRef }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search documents..."
          className="search-input"
          aria-label="Search documents"
        />
        <button type="submit" className="search-button">
          <span className="search-icon">🔍</span>
          <span className="search-text">Search</span>
        </button>
      </form>
      <div className="search-suggestions">
        <p>Try: "city streets" • "rural landscapes" • "women in uniform" • "symbol of capitalization"</p>
      </div>
    </div>
  );
}

export default SearchBar;
