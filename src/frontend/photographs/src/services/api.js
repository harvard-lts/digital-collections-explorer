// API service for interacting with the backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Search for photographs by text query
 * @param {string} query - The text query
 * @param {number} limit - Maximum number of results to return (default: 50)
 * @param {number} page - Page number for pagination (default: 1)
 * @returns {Promise<Array>} - Array of search results
 */
export const searchPhotos = async (query, limit = 50, page = 1) => {
  try {
    // Ensure page parameter is a valid number
    const validPage = Math.max(1, parseInt(page) || 1);
    
    console.log(`Searching with query: "${query}", limit: ${limit}, page: ${validPage}`);
    const response = await fetch(`${API_URL}/api/search/text?query=${encodeURIComponent(query)}&limit=${limit}&page=${validPage}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const { results } = await response.json();
    console.log(`Received ${results.length} results for page ${validPage}`);
    
    // Transform the data to match the expected format in the frontend
    return results.map(item => ({
      id: item.id,
      file_path: item.file_path,
      file_name: item.file_name,
      similarity: item.score,
      metadata: {
        title: item.file_name,
        path: item.file_path,
      }
    }));
  } catch (error) {
    console.error('Error searching photos:', error);
    throw error;
  }
};

/**
 * Get statistics about embeddings (total count)
 * @returns {Promise<Object>} - Statistics object with count property
 */
export const getEmbeddingStats = async () => {
  try {
    const response = await fetch(`${API_URL}/api/embeddings/count`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching embedding stats:', error);
    return { count: 0 };
  }
};

/**
 * Search for similar photographs by image
 * @param {File} image - The image file to search with
 * @param {number} limit - Maximum number of results to return
 * @param {number} page - Page number for pagination
 * @returns {Promise<Array>} - Array of search results
 */
export const searchByImage = async (image, limit = 50, page = 1) => {
  try {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('resultsPerPage', limit);
    formData.append('page', page);

    const response = await fetch(`${API_URL}/api/search/image`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in image search:', error);
    throw error;
  }
};
