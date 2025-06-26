import React, { useCallback, useMemo, useState } from 'react';
import { Gallery } from 'react-grid-gallery';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Lightbox from 'yet-another-react-lightbox';
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'yet-another-react-lightbox/styles.css';
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
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

  const thumbnailImageComponent = useCallback(({ item, imageProps }) => (
    <LazyLoadImage
      alt={imageProps.alt}
      effect="blur"
      src={item.thumbnail}
      height={item.thumbnailHeight}
      width={item.thumbnailWidth}
      style={{ objectFit: 'cover' }}
      className="historical-image"
      placeholderSrc='https://placehold.co/300x200'
    />
  ), []);

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

  if (photos.length > 0) {
    return (
      <div className="gallery-container">
        <Gallery 
          images={photos}
          enableImageSelection={false}
          thumbnailImageComponent={thumbnailImageComponent}
          onClick={handleLightboxOpened}
          margin={2}
          rowHeight={180}
          targetRowHeight={200}
          containerWidth={window.innerWidth * 0.95}
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
      </div>
    );
  }

  return (
    <div className="welcome-message">
      <p>Enter a search term to explore historical photographs.</p>
      <p>Try searching for subjects, time periods, locations, or visual elements.</p>
      <p>You can also search by uploading a similar image.</p>
    </div>
  );
});

export default SearchResults;
