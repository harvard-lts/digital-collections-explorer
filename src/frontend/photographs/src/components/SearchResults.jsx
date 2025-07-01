import React, { useCallback, useMemo, useState } from 'react';
import { Gallery } from 'react-grid-gallery';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import Pagination from './Pagination';
import './SearchResults.css';

const SearchResults = React.memo(({ 
  photos,
  isLoading,
  error,
  currentPage,
  setCurrentPage,
  hasMore,
}) => {
  const [currentLightboxImageIndex, setCurrentLightboxImageIndex] = useState(0);
  const [lightboxIsOpen, setLightboxIsOpen] = useState(false);

  const lightboxSlides = useMemo(() => photos.map(photo => ({
    src: photo.src,
    alt: photo.alt,
    title: photo?.originalData?.metadata?.title || photo?.originalData?.metadata?.file_name || 'Untitled',
    description: photo?.originalData?.metadata?.description || photo?.originalData?.metadata?.paths?.original,
  })), [photos]);

  const handleLightboxOpened = useCallback((index) => {
    setCurrentLightboxImageIndex(index);
    setLightboxIsOpen(true);
  }, []);

  const handleLightboxClosed = useCallback(() => {
    setLightboxIsOpen(false);
  }, []);

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
        photos.length > 0 && (
          <>
            <Gallery
              images={photos}
              enableImageSelection={false}
              onClick={handleLightboxOpened}
              margin={2}
              rowHeight={180}
            />
            <Lightbox
              slides={lightboxSlides}
              open={lightboxIsOpen}
              index={currentLightboxImageIndex}
              close={handleLightboxClosed}
              plugins={[Captions, Thumbnails, Zoom]}
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
