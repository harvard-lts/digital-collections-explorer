import React from 'react';
import './PhotoInfo.css';

function PhotoInfo({ photo }) {
  if (!photo) return null;

  const { metadata, collection_id, similarity } = photo;
  
  // Format date if available
  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    // Try to parse the date
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString; // Return original on error
    }
  };

  return (
    <div className="photo-info">
      <div className="photo-info-header">
        <h3>{metadata.title || metadata.filename || 'Untitled Photograph'}</h3>
        {similarity !== undefined && (
          <div className="similarity-score">
            <span>Similarity: </span>
            <span className="score">{(similarity * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      <div className="photo-info-details">
        {metadata.caption && (
          <div className="info-row">
            <span className="info-label">Caption:</span>
            <span className="info-value">{metadata.caption}</span>
          </div>
        )}
        
        {metadata.date && (
          <div className="info-row">
            <span className="info-label">Date:</span>
            <span className="info-value">{formatDate(metadata.date)}</span>
          </div>
        )}
        
        {metadata.creator && (
          <div className="info-row">
            <span className="info-label">Creator:</span>
            <span className="info-value">{metadata.creator}</span>
          </div>
        )}
        
        {metadata.location && (
          <div className="info-row">
            <span className="info-label">Location:</span>
            <span className="info-value">{metadata.location}</span>
          </div>
        )}
        
        {collection_id && (
          <div className="info-row">
            <span className="info-label">Collection:</span>
            <span className="info-value">{collection_id}</span>
          </div>
        )}
        
        {/* Add more metadata fields as needed */}
      </div>
    </div>
  );
}

export default PhotoInfo; 