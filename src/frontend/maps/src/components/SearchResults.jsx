import React from 'react';
import { Gallery } from 'react-grid-gallery';
import Pagination from './Pagination';
import './SearchResults.css';

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

export default SearchResults;
