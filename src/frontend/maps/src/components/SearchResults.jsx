import React from 'react';
import { Gallery } from 'react-grid-gallery';
import Pagination from './Pagination';
import './SearchResults.css';

const SearchResults = React.memo(({
  items,
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
  return (
    <div className="gallery-container">
      {
        items.length > 0 && (
          <>
            <Gallery
              images={items}
              enableImageSelection={false}
              onClick={(index) => onClick(items[index])}
              margin={0}
              rowHeight={220}
            />
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              hasMore={hasMore}
              isLoading={isLoading}
            />
          </>
        )
      }
    </div>
  );
});

export default SearchResults;
