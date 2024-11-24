import { useState } from 'react';
import { useAuthStatus } from '../context/authContext';
import toast from "react-hot-toast";
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { logout: clearAuth } = useAuthStore();
  const { logout : statusLogout } = useAuthStatus(); // Get login function from auth context
    const navigate = useNavigate();

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
        localStorage.removeItem('authUser'); // Make sure to remove user data from localStorage
        clearAuth();
        statusLogout(); // Call logout function from auth context
        navigate('/login');
        toast.success("Logout successful");

    } catch (err) {
        toast.error("Failed to logout");
        setError(err.message);
    } finally {
        setLoading(false);
    }
};


  return { logout, loading, error };
};

export default useLogout;
