import { useState } from 'react';

const useDeleteImage = () => {
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    
  const API_BASE_URL =  import.meta.env.VITE_API_BASE_URL  || '/api' ;

    const deleteImage = async (publicId) => {
        setDeleteLoading(true);
        setDeleteError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/delete-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ public_id: publicId }), // Pass the public ID to the backend
            });

            if (!response.ok) {
                throw new Error('Failed to delete image');
            }

        } catch (err) {
            console.error('Error deleting image:', err.message);
            setDeleteError(err.message);
        } finally {
            setDeleteLoading(false);
        }
    };

    return { deleteImage, deleteLoading, deleteError };
};

export default useDeleteImage;