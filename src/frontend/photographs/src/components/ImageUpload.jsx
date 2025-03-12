import React, { useRef } from 'react';

function ImageUpload({ selectedImage, setSelectedImage }) {
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedImage(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div 
      className="image-upload"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      {selectedImage ? (
        <div className="preview-container">
          <img 
            src={URL.createObjectURL(selectedImage)} 
            alt="Preview" 
            className="image-preview" 
          />
          <span className="filename">{selectedImage.name}</span>
        </div>
      ) : (
        <div className="upload-placeholder">
          <p>Click or drag an image here</p>
          <p className="small">Supported formats: JPG, PNG, GIF</p>
        </div>
      )}
    </div>
  );
}

export default ImageUpload; 