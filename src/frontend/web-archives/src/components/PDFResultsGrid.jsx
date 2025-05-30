import React, { useState } from 'react';
import PDFPreviewCard from './PDFPreviewCard';
import PDFViewer from './PDFViewer';
import { getImageUrl } from '../services/api';
import './PDFResultsGrid.css';

const PDFResultsGrid = ({ items }) => {
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const openPDFViewer = (item) => {
    setSelectedPDF(item);
    setIsModalOpen(true);
  };
  
  const closePDFViewer = () => {
    setIsModalOpen(false);
  };
  
  return (
    <div className="pdf-results-grid">
      <div className="pdf-grid-container">
        {Object.values(items).map((item, index) => (
          <div className="pdf-grid-item" key={index}>
            <PDFPreviewCard 
              metadata={item}
              src={getImageUrl(item.id, 'thumbnail')}
              onClick={() => openPDFViewer(item)}
            />
          </div>
        ))}
      </div>
      
      {isModalOpen && selectedPDF && (
        <div className="pdf-modal-overlay">
          <div className="pdf-modal-content">
            <PDFViewer 
              pdf={selectedPDF} 
              onClose={closePDFViewer}
              initialPage={selectedPDF?.page || 0}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFResultsGrid;
