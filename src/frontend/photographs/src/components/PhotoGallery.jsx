import React from 'react';
import Gallery from 'react-photo-gallery';

function PhotoGallery({ photos }) {
  const galleryPhotos = photos.map(photo => ({
    src: photo.url,
    width: photo.width || 4,
    height: photo.height || 3,
    alt: photo.title || 'Photo'
  }));

  return <Gallery photos={galleryPhotos} />;
}

export default PhotoGallery;
