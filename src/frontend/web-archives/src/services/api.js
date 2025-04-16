// API service for interacting with the backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Search for web archives by text query
 * @param {string} query - The text query
 * @param {number} limit - Maximum number of results to return (default: 25)
 * @returns {Promise<Array>} - Array of search results
 */
export const searchPhotos = async (query, limit = 50) => {
  try {
    const response = await fetch(`${API_URL}/api/search/text?query=${encodeURIComponent(query)}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const { results } = await response.json();
    
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
