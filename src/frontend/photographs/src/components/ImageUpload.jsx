import React, { useState } from 'react';

function ImageUpload({ selectedImage, setSelectedImage }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    
    // Create a preview URL for the selected image
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
      
      // Create a preview URL for the dropped image
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
          accept="image/*"
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
              <p className="smaller">Supported formats: JPG, PNG, GIF</p>
            </div>
          )}
        </label>
      </div>
      
      {previewUrl && (
        <button 
          className="clear-button"
          onClick={() => {
            setSelectedImage(null);
            setPreviewUrl(null);
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