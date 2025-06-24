import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import './PDFPreviewCard.css';

const PDFPreviewCard = ({ metadata, src, alt, onClick }) => {
  return (
    <div className="pdf-preview-card" onClick={() => onClick()}>
      <div className="pdf-thumbnail-container">
        <LazyLoadImage
          alt={alt || metadata.alt|| ''}
          effect="blur"
          src={src}
          width="100%"
          placeholderSrc='https://placehold.co/300x200'
        />
      </div>
      
      <div className="pdf-card-content">
        <h3 className="pdf-card-title">{metadata.file_name.split('.pdf')[0]}</h3>
        <div className="pdf-card-metadata">
          {metadata.type === 'pdf_page' && metadata.page !== undefined && (
            <span>Page {metadata.page + 1} of {metadata.n_pages || '?'}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewCard;
