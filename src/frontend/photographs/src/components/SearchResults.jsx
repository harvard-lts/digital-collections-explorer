import React from 'react';
import { Gallery } from 'react-grid-gallery';
import Lightbox from 'yet-another-react-lightbox';
import './SearchResults.css';

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
        <p>Searching historical photographs...</p>
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

  return (
    <div className="welcome-message">
      <p>Enter a search term to explore historical photographs.</p>
      <p>Try searching for subjects, time periods, locations, or visual elements.</p>
    </div>
  );
});

export default SearchResults;