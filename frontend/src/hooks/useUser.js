import { useState, useCallback } from 'react';
import { useSessionStore } from '../store/sessions';

const useUser = () => {
    const [users, setUsers] = useState([]);
    const [showAddUser, setShowAddUser] = useState(false);
    
    const API_BASE_URL =  import.meta.env.VITE_API_BASE_URL  || '/api' ;

    const fetchWithToken = async (url, options = {}) => {
        const token = authUser.authUser.token;
        
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const response = await fetch(url, { ...options, headers });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'An error occurred');
        }
        
        return response.json();
    };

    const fetchUsers = useCallback(async () => {
        try {
            const data = await fetchWithToken(`${API_BASE_URL}/auth/users`, { method: 'GET' });
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }, []);

    const handleAddUser = useCallback(async (userData) => {
        try {
            const formData = new FormData();
            Object.entries(userData).forEach(([key, value]) => {
                if (value !== undefined) {
                    formData.append(key, value);
                }
            });

            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${useSessionStore.getState().token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to add user');
            }

            fetchUsers();
            setShowAddUser(false);
        } catch (error) {
            console.error('Failed to add user:', error);
        }
    }, [fetchUsers]);

    return {
        users,
        showAddUser,
        setShowAddUser,
        fetchUsers,
        handleAddUser,
    };
};

export default useUser;