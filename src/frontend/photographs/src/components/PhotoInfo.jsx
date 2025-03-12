import React from 'react';
import './PhotoInfo.css';

const PhotoInfo = ({ photo }) => {
  if (!photo) return null;
  
  return (
    <div className="photo-info">
      <h3>{photo.metadata.title || photo.file_name || 'Untitled'}</h3>
      
      <div className="photo-metadata">
        <p><strong>File:</strong> {photo.file_name}</p>
        <p><strong>Path:</strong> {photo.file_path}</p>
        <p><strong>Similarity Score:</strong> {(photo.similarity * 100).toFixed(1)}%</p>
        
        {/* Add any additional metadata fields that might be available */}
        {photo.metadata.date && (
          <p><strong>Date:</strong> {photo.metadata.date}</p>
        )}
        {photo.metadata.creator && (
          <p><strong>Creator:</strong> {photo.metadata.creator}</p>
        )}
        {photo.metadata.description && (
          <p><strong>Description:</strong> {photo.metadata.description}</p>
        )}
      </div>
    </div>
  );
};

export default PhotoInfo;
