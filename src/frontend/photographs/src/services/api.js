const API_URL = '/api';

export const fetchPhotos = async () => {
  const response = await fetch(`${API_URL}/photos`);
  if (!response.ok) {
    throw new Error('Failed to fetch photos');
  }
  return response.json();
};

export const searchPhotos = async (query) => {
  const response = await fetch(`${API_URL}/search/text?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search photos');
  }
  return response.json();
};

export const uploadPhoto = async (formData) => {
  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error('Failed to upload photo');
  }
  return response.json();
};
