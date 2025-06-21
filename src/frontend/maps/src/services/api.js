const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// export const getImageUrl = (documentId, size) => {
//   if (!documentId) return '';
//   if (size) {
//     return `${API_URL}/images/${encodeURIComponent(documentId)}?size=${size}`;
//   }
//   return `${API_URL}/images/${encodeURIComponent(documentId)}`;
// };

/**
 * Library of Congress image URL processing adaptation
 */
export const getImageUrl = (url, size = 'full') => {
  const sizeParam = typeof size === 'string' ? size : `${size},`;
  const urlParts = url.split('/');
  const iiifIndex = urlParts.findIndex(part => part === 'iiif');
  const identifier = iiifIndex !== -1 ? urlParts.slice(iiifIndex + 1, -4).join('/') : '';
  const baseUrl = `https://tile.loc.gov/image-services/iiif/${identifier}`;
  
  return `${baseUrl}/full/${sizeParam}/0/default.jpg`;
};

/**
 * Search for maps by text query
 * @param {string} query - The text query
 * @param {number} limit - Maximum number of results to return (default: 50)
 * @param {number} page - Page number for pagination (default: 1)
 * @returns {Promise<Array>} - Array of search results
 */
export const searchByText = async (query, limit = 50, page = 1) => {
  try {
    const pageParam = Math.max(1, parseInt(page) || 1);
    const response = await fetch(`${API_URL}/api/search/text?query=${encodeURIComponent(query)}&limit=${limit}&page=${pageParam}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const { results } = await response.json();
    
    return results.map(item => ({
      id: item.id,
      file_path: item.file_path,
      similarity: item.score,
      metadata: item.metadata
    }));
  } catch (error) {
    console.error('Error searching photos:', error);
    throw error;
  }
};

/**
 * Search for similar maps by image
 * @param {File} image - The image file to search with
 * @param {number} limit - Maximum number of results to return
 * @param {number} page - Page number for pagination
 * @returns {Promise<Array>} - Array of search results
 */
export const searchByImage = async (image, limit = 50, page = 1) => {
  try {
    const formData = new FormData();

    formData.append('image', image);
    formData.append('limit', limit);
    formData.append('page', page);

    const response = await fetch(`${API_URL}/api/search/image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const { results } = await response.json();

    return results.map(item => ({
      id: item.id,
      file_path: item.file_path,
      similarity: item.score,
      metadata: item.metadata
    }));
  } catch (error) {
    console.error('Error in image search:', error);
    throw error;
  }
};
