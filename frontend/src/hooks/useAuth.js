import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useAuthStatus } from '../context/authContext'; // Import auth context
import { useSessionStore } from '../store/sessions';


export const useAuth = () => {
  const navigate = useNavigate();
  const { login: setAuth, logout: clearAuth } = useAuthStore();
  const { login: saveUser, logout: statusLogout } = useAuthStatus(); // Get login function from auth context
  const [error, setError] = useState('');

  const API_BASE_URL =  import.meta.env.VITE_API_BASE_URL  || '/api' ;

  const {
    endSession: clearActiveSession,
  } = useSessionStore();

  const login = useCallback(async (admissionNumber, password, purpose, labId, online) => {
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admissionNumber, password, purpose, labId, online }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const data = await response.json();
      
      setAuth(data.user, data.token);
      saveUser(data);
      navigate(data.user.role === 'admin' ? '/admin' : '/user');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid credentials');
      throw error;
    }
  }, [setAuth, navigate]);

  const logout = useCallback(async () => {
    // try {
    //   const response = await fetch('/api/sessions/end', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ userData: authUser?.user }),
    //   });

    //   if (!response.ok) {
    //     const errorData = await response.json();
    //     throw new Error(errorData.message || 'Logout failed');
    //   }

      clearActiveSession();
      clearAuth();
      statusLogout(); // Call logout function from auth context
      navigate('/login');
    // } catch (error) {
    //   console.error('Error ending session:', error);
    // }
  }, [clearActiveSession, clearAuth, navigate]);

  return { login, logout, error };
};
