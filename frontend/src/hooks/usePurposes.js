import { useCallback, useEffect, useState } from "react";
import { useAuthStatus } from "../context/authContext";

export const usePurposes = () => {
    const { authUser } = useAuthStatus();
    const [purposes, setPurposes] = useState([]);

    const API_BASE_URL =  import.meta.env.VITE_API_BASE_URL  || '/api' ;

    const fetchWithToken = async (url, options = {}) => {
        const token = authUser?.token;
        const headers = {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "An error occurred");
        }
        return response.json();
    };

    const fetchPurposes = useCallback(async () => {
        try {
            const data = await fetchWithToken(`${API_BASE_URL}/purposes`, { method: 'GET' });
            setPurposes(data);
        } catch (error) {
            console.error('Failed to fetch purposes:', error);
        }
    }, [setPurposes]);

    const deletePurpose = useCallback(async (purposeId) => {
        try {
            await fetchWithToken(`${API_BASE_URL}/purposes/${purposeId}`, { method: 'DELETE' });
            fetchPurposes();
        } catch (error) {
            console.error('Failed to delete purpose:', error);
        }
    }, [fetchPurposes]);

    const handleEditPurpose = useCallback(async (purposeData) => {
        try {
            await fetchWithToken(`${API_BASE_URL}/purposes/${purposeData._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purposeData),
            });
            fetchPurposes();
        } catch (error) {
            console.error('Failed to edit purpose:', error);
        }
    }, [fetchPurposes]);

    const handleAddPurpose = useCallback(async (purposeData) => {
        try {
            await fetchWithToken(`${API_BASE_URL}/purposes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purposeData),
            });
            fetchPurposes();
        } catch (error) {
            console.error('Failed to add purpose:', error);
        }
    }, [fetchPurposes]);

    useEffect(() => {
        fetchPurposes();
    }, [fetchPurposes]);

    return {
        purposes,
        fetchPurposes,
        deletePurpose,
        handleEditPurpose,
        handleAddPurpose,
    };
};