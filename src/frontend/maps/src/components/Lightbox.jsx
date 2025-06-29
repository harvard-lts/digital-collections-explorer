import React, { useRef, useEffect, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { getLocInfo } from '../services/api';
import './Lightbox.css';

const Lightbox = React.memo(({ data, onBack, isVisible }) => {
  const viewerRef = useRef(null);
  const [isViewerLoading, setIsViewerLoading] = useState(true);
  const [isMapInfoLoading, setIsMapInfoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapTitle, setMapTitle] = useState('');

  useEffect(() => {
    if (!isVisible || !viewerRef.current) {
      return;
    }

    setIsViewerLoading(true);
    setError(null);

    const viewer = OpenSeadragon({
      element: viewerRef.current,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      tileSources: data.iiifInfo,
      showNavigator: true,
      minZoomLevel: 0.1,
      defaultZoomLevel: 0.5,
      maxZoomLevel: 10
    });

    viewer.addHandler('open', () => {
      setIsViewerLoading(false);
    });

    viewer.addHandler('open-failed', () => {
      setError('Failed to load image');
      setIsViewerLoading(false);
    });

    return () => {
      viewer.destroy();
    };
  }, [data, isVisible]);

  useEffect(() => {
    if (!data) return;

    setIsMapInfoLoading(true);
    setMapTitle('');
    
    try {
      const fetchLocInfo = async () => {
        const locInfo = await getLocInfo(data.metadata.url);
        setMapTitle(locInfo?.item?.title || 'Untitled');
        setIsMapInfoLoading(false);
      };
      fetchLocInfo();
    } catch (error) {
      console.error('Failed to fetch LOC info:', error);
      setError('Failed to get map\'s info from Library of Congress\'s API. Please try again.');
      setIsMapInfoLoading(false);
    }
  }, [data]);

  return (
    <div className={`lightbox-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="lightbox-container">
        <button className="tile-gallery-back" onClick={onBack}>
          Back to results
        </button>
        <div className="tile-gallery-viewer" ref={viewerRef}>
          {isVisible && isViewerLoading &&(
            <div className="lightbox-loading">
              <div className="lightbox-spinner" />
              <p>Loading map...</p>
            </div>
          )}
          {isVisible && error && (
            <div className="lightbox-error">
              <div className="lightbox-error-icon">⚠️</div>
              <p>{error}</p>
            </div>
          )}
        </div>
        {data && (
          <div className="lightbox-info-overlay">
            <h3 className="lightbox-title">
              {
                isMapInfoLoading ? (
                  <span>Loading map's info...</span>
                ) : (
                  <span>{mapTitle}</span>
                )
              }
            </h3>            
            {data?.metadata?.url && (
              <a href={data.metadata.url} target="_blank" rel="noopener noreferrer" className="lightbox-source-link">
                View at Library of Congress
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default Lightbox;
