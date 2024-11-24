import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, X, Upload, Loader } from 'lucide-react';
import useUploadImage from "../../hooks/useUploadImage";
import useDeleteImage from "../../hooks/useDeleteImage";

export default function AddUserModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    admissionNumber: '',
    name: '',
    class: '',
    password: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageName, setImageName] = useState('');
  const [touchedImage, setTouchedImage] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { uploadImage, loading: uploadLoading, error: uploadError, data: uploadData, publicId } = useUploadImage();
  const { deleteImage, loading: deleteLoading, error: deleteError } = useDeleteImage();

  useEffect(() => {
    if (uploadData) {
      setImagePreview(uploadData);
    }
  }, [uploadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit({ ...formData, image: uploadData || undefined });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    if (e.target.files?.[0]) {
      if (image) {
        setError('Please remove the existing image before uploading a new one.');
        return;
      }

      const newImage = e.target.files[0];
      setImageName(newImage.name);
      setTouchedImage(true);

      try {
        const uploadedImage = await uploadImage(newImage);
        setImage(uploadedImage);
      } catch (err) {
        setError('Failed to upload new image');
      }
    }
  };

  const handleRemoveImage = async () => {
    if (publicId) {
      await deleteImage(publicId);
      setImagePreview(null);
      setImageName('');
      setTouchedImage(true);
      setImage(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white/10 border border-white/20 rounded-xl p-6 max-w-md w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Add New User</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-200">
              Admission Number
            </label>
            <input
              type="text"
              value={formData.admissionNumber}
              onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
              className="mt-1 block w-full rounded-lg bg-white/5 border border-white/10 py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                const capitalizeWords = (str) => {
                  return str
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                };

                setFormData({ ...formData, name: capitalizeWords(e.target.value) });
              }}
              className="mt-1 block w-full rounded-lg bg-white/5 border border-white/10 py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200">
              Class
            </label>
            <input
              type="text"
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              className="mt-1 block w-full rounded-lg bg-white/5 border border-white/10 py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full rounded-lg bg-white/5 border border-white/10 py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">
              Profile Image
            </label>
            <div className="flex items-center justify-center w-full">
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors ${uploadLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader className="w-8 h-8 mb-2 text-blue-400 animate-spin" />
                      <p className="text-sm text-blue-200">Uploading...</p>
                    </div>
                  ) : imagePreview ? (
                    <img src={imagePreview} alt="Profile Preview" className="w-24 h-24 object-cover rounded-full mb-2" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-blue-400" />
                      <p className="text-sm text-blue-200">
                        {imageName || 'Click to upload profile image'}
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={image !== null}
                />
              </label>
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="mt-2 text-red-500 hover:text-red-700 transition-colors"
              >
                Remove Image
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-300 bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading || uploadLoading || deleteLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full bg-blue-600/20 border border-blue-500/30 text-blue-100 py-2 rounded-lg hover:bg-blue-600/30 transition-colors duration-200 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
          >
            {isLoading ? 'Processing...' : 'Add User'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
