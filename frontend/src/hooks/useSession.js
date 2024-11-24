import { useCallback, useEffect, useState } from "react";
import { useSessionStore } from "../store/sessions";
import { useLabStore } from "../store/lab";
import { useAuthStatus } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import ConfirmationModal from "../components/admin/ConfirmationModal"; // Import your ConfirmationModal component

export const useSession = () => {
  const { authUser } = useAuthStatus();
  const navigate = useNavigate();
  const { logout: clearAuth } = useAuthStore();
  const { logout: statusLogout } = useAuthStatus();
  const labId = useLabStore((state) => state.labId);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  const {
    sessions,
    allSessions,
    activeSession,
    startSession: setActiveSession,
    endSession: clearActiveSession,
    updateLastActivity,
  } = useSessionStore();

  // Modal state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState({});

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

  const getLimitedSessions = useCallback(async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `/api/sessions?${queryString}`;

    try {
      const data = await fetchWithToken(url, { method: "GET" });
      useSessionStore.setState({ sessions: data.sessions });
      return data;
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      throw error;
    }
  }, []);

  const getAllSessions = useCallback(async () => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/sessions/all`, { method: "GET" });
      useSessionStore.setState({ allSessions: data });
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      throw error;
    }
  }, []);

  const startSession = useCallback(
    async (purpose) => {
      if (activeSession) {
        console.warn("A session is already active. Cannot start a new session.");
        return;
      }
      try {
        const data = await fetchWithToken(`${API_BASE_URL}/sessions/start`, {
          method: "POST",
          body: JSON.stringify({ purpose, labId, user: authUser?.user }),
        });
        setActiveSession(data.session);
      } catch (error) {
        console.error("Failed to start session:", error);
        throw error;
      }
    },
    [labId, setActiveSession, authUser]
  );

  const endSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userData: authUser?.user }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Logout failed');
      }

      clearActiveSession();
      clearAuth();
      statusLogout(); // Call logout function from auth context
      navigate('/login');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [clearActiveSession, clearAuth, navigate]);

  const checkInternetConnection = async () => {
    // Step 1: Check browser's online status
    if (!navigator.onLine) {
      console.log("Browser is offline");
      return false;
    }
  
    // Step 2: Confirm connection with a backend ping
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/ping`, {
        method: 'GET',
        cache: 'no-store',
      });
      console.log("Backend ping response:", response.status);
      
      // Consider response status 200 as successful connectivity
      return response.ok;
    } catch (error) {
      console.error("Error during backend ping check:", error);
      return false;
    }
  };
  

  const handleConfirmLogout = () => {
    clearActiveSession();
    clearAuth();
    statusLogout();
    navigate('/login');
    setIsModalOpen(false);
  };

  const handleCancelLogout = () => {
    setIsModalOpen(false);
    setConfirmationData({});
  };

  const updateActivity = useCallback(async () => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/sessions/activity`, { 
        method: "PUT",
        body: JSON.stringify({ userData: authUser?.user }),
      });
  
      if (!response || response.message === "Server error") {
        console.error("Failed to update activity:", response.message || "No response");

        // Check internet connection status
        const internetAvailable = await checkInternetConnection();

        console.log("Internet available:", internetAvailable);

        console.log("Active session:", activeSession);

        if (!internetAvailable) {
          // Show Network Issue warning if there's no internet
          setConfirmationData({
            title: "Network Issue",
            message: "Internet connection lost. Do you want to continue the session or logout?",
            onConfirm: handleConfirmLogout,
            buttonLabel: "Logout",
          });
          setIsModalOpen(true);
        } else if (!activeSession) {
          // Show Session Expired warning if internet is fine but no active session
          setConfirmationData({
            title: "Session Expired",
            message: "Your session has expired. Please log in again.",
            onConfirm: handleConfirmLogout,
            buttonLabel: "Logout",
          });
          setIsModalOpen(true);
        } else {
          // Assume session is invalid if there's no internet issue
          clearActiveSession();
          clearAuth();
          statusLogout();
          navigate("/login");
        }
        return;
      }
  
      // Update last activity timestamp if successful
      updateLastActivity();
    } catch (error) {
      console.error("Failed to update activity:", error);
  
      // Handle error similarly if there's a failure
      const internetAvailable = await checkInternetConnection();

      console.log("Internet available:", internetAvailable);
      
      if (!internetAvailable) {
        // Show Network Issue warning if there's no internet
        setConfirmationData({
          title: "Network Issue",
          message: "Internet connection lost. Do you want to continue the session or logout?",
          onConfirm: handleConfirmLogout,
          buttonLabel: "Logout",
        });
        setIsModalOpen(true);
      } else if (activeSession) {
        // Show Session Expired warning if internet is fine but no active session
        setConfirmationData({
          title: "Session Expired",
          message: "Your session has expired. Please log in again.",
          onConfirm: handleConfirmLogout,
          buttonLabel: "Logout",
        });
        setIsModalOpen(true);
      } else {
        clearActiveSession();
        clearAuth();
        statusLogout();
        navigate("/login");
      }
    }
  }, [updateLastActivity, clearActiveSession, clearAuth, activeSession, statusLogout, navigate, checkInternetConnection]);

  // Set up activity tracking
  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(updateActivity, 6000); // Update every 6 seconds
      return () => clearInterval(interval);
    }
  }, [activeSession, updateActivity]);

  return {
    sessions,
    allSessions,
    activeSession,
    getAllSessions,
    getLimitedSessions,
    startSession,
    endSession,
    updateActivity,
    ConfirmationModal, // Return the modal for use
    isModalOpen,
    confirmationData,
    handleCancelLogout,
  };
};
