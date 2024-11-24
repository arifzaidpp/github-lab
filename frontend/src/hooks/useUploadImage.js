import { set } from 'lodash';
import { useState } from 'react';

const useUploadImage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [publicId, setPublicId] = useState(null);
    
  const API_BASE_URL =  import.meta.env.VITE_API_BASE_URL  || '/api' ;

  const uploadImage = async (imageFile) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      
      setPublicId(result.public_id); // Assuming the public ID is returned in result.public_id
      setData(result.image); // Assuming the image URL is returned in result.image
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { uploadImage, loading, error, data, publicId };
};

export default useUploadImage;
