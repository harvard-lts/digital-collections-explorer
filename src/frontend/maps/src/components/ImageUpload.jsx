import React, { useState, useEffect } from 'react';

function ImageUpload({ selectedImage, setSelectedImage }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
    }
  }, [selectedImage]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="image-upload">
      <div 
        className="drop-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/jpeg, image/png, image/gif, image/bmp, image/tiff, image/webp"
          onChange={handleImageChange}
          id="image-upload"
        />
        <label htmlFor="image-upload">
          {previewUrl ? (
            <div className="preview-container">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="image-preview" 
              />
            </div>
          ) : (
            <div className="upload-prompt">
              <p>Drag and drop an image here or click to select</p>
              <p className="smaller">Supported formats: JPG, PNG, GIF, BMP, TIFF, WEBP</p>
            </div>
          )}
        </label>
      </div>
      
      {previewUrl && (
        <button 
          className="clear-button"
          onClick={() => {
            setSelectedImage(null);
            document.getElementById('image-upload').value = '';
          }}
        >
          Clear Image
        </button>
      )}
    </div>
  );
}

export default ImageUpload;
