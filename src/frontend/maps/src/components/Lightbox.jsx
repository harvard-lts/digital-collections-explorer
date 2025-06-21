import React, { useRef, useEffect, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import './Lightbox.css';

const Lightbox = React.memo(({ imageUrl, onBack, isVisible }) => {
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isVisible || !viewerRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const viewer = OpenSeadragon({
      element: viewerRef.current,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      tileSources: {
        type: 'image',
        url: imageUrl
      },
      showNavigator: true,
      minZoomLevel: 0.1,
      defaultZoomLevel: 0.5,
      maxZoomLevel: 10
    });

    viewer.addHandler('open', () => {
      setIsLoading(false);
    });

    viewer.addHandler('open-failed', () => {
      setError('Failed to load image');
      setIsLoading(false);
    });

    return () => {
      viewer.destroy();
    };
  }, [imageUrl, isVisible]);

  useEffect(() => {
    if (!isLoading) return;

    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  return (
    <div className={`lightbox-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="lightbox-container">
        <button className="tile-gallery-back" onClick={onBack}>
          Back to results
        </button>
        <div className="tile-gallery-viewer" ref={viewerRef}>
          {isLoading && isVisible && (
            <div className="lightbox-loading">
              <div className="lightbox-spinner" />
              <p>Loading map...</p>
            </div>
          )}
          {error && isVisible && (
            <div className="lightbox-error">
              <div className="lightbox-error-icon">⚠️</div>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default Lightbox;
