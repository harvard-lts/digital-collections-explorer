import React, { useState, useCallback } from 'react';
import { getDownloadUrl, getImageUrl } from '../services/api';
import './PDFViewer.css';

const PDFViewer = ({ pdf, onClose, initialPage = 0 }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const totalPages = pdf.n_pages || 1;
  const baseId = pdf.id.split('_')[0];
  
  const getCurrentPageId = (pageNum) => {
    return `${baseId}_${pageNum}`;
  };
  
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => (prev > 0 ? prev - 1 : prev));
  }, []);
  
  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => (prev < totalPages - 1 ? prev + 1 : prev));
  }, [totalPages]);
  
  return (
    <div className="pdf-viewer-container">
      <div className="pdf-viewer-controls">
        <div className="pdf-control-left"></div>
        
        <div className="pdf-page-counter">
          Page {currentPage + 1} of {totalPages}
        </div>
        
        <div className="pdf-control-right">
          <button className="pdf-control-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="16" height="16" fill="currentColor">
              <path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="pdf-viewer-content">
        <div className="pdf-navigation">
          <button 
            className="pdf-nav-button" 
            onClick={handlePrevPage} 
            disabled={currentPage === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="20" height="20" fill="currentColor">
              <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
            </svg>
          </button>
        </div>
        
        <div className="pdf-page-container">
          <div className="pdf-page-wrapper">
            <img 
              src={getImageUrl(getCurrentPageId(currentPage))} 
              alt={`Page ${currentPage + 1} of ${totalPages}`}
              className="pdf-page-image"
            />
          </div>
        </div>
        
        <div className="pdf-navigation">
          <button 
            className="pdf-nav-button" 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages - 1}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="20" height="20" fill="currentColor">
              <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="pdf-viewer-footer">
        <div className="pdf-metadata">
          <div className="pdf-info">
            <h3 className="pdf-info-title">{pdf.file_name || 'Untitled'}</h3>
          </div>
        </div>
        
        <div className="pdf-action-buttons">
          <a 
            href={getDownloadUrl(pdf.id)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="download-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16" fill="currentColor" style={{ marginRight: '5px' }}>
              <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/>
            </svg>
            Download PDF
          </a>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
