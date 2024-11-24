import { useEffect, useState, useCallback } from 'react';
import { useSession } from '../../hooks/useSession';
import { useAuthStore } from '../../store/auth';
import FloatingTimer from '../../components/FloatingTimer';
import { Monitor, Loader } from 'lucide-react';
import { useAuthStatus } from '../../context/authContext';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/admin/ConfirmationModal';

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const { 
    activeSession, 
    startSession, 
    endSession, 
    isModalOpen, 
    confirmationData, 
    handleCancelLogout 
  } = useSession();
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [logoutClicked, setLogoutClicked] = useState(false);
  const { authUser } = useAuthStatus();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  // Monitor activeSession to trigger exit fullscreen in Electron
  useEffect(() => {
    if (activeSession && window.electron) {
      window.electron.invoke('exit-fullscreen');
    } else if (!activeSession && window.electron) {
      window.electron.invoke('enter-fullscreen');
    }
  }, [activeSession]);

  // Handle Fullscreen for Logout State
  useEffect(() => {
    if (!logoutClicked && window.electron) {
      window.electron.invoke('exit-fullscreen');
    } else if (logoutClicked && window.electron) {
      window.electron.invoke('enter-fullscreen');
    }
  }, [logoutClicked]);

  useEffect(() => {
    if (!isModalOpen && window.electron) {
      window.electron.invoke('exit-fullscreen');
    } else if (isModalOpen && window.electron) {
      window.electron.invoke('enter-fullscreen');
    }
  }, [isModalOpen]);

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      if (!activeSession && user && !isStartingSession && authUser?.session.online) {
        setIsStartingSession(true);

        try {
          const defaultPurpose = authUser?.session?.purpose || 'Internet';
          await startSession(defaultPurpose);
        } catch (error) {
          console.error('Failed to start session:', error);
          navigate('/login');
        } finally {
          setIsStartingSession(false);
        }
      }
      setIsInitializing(false);
    };

    if (isInitializing) {
      initializeSession();
    }
  }, [activeSession, user, startSession, navigate, isInitializing, isStartingSession, authUser]);

  // End session handler with confirmation
  const handleEndSession = async () => {
    try {
      await endSession();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  // Logout function
  const handleLogout = async () => {
    setLogoutClicked(true);
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userData: user,
        }),
      });

      await logout();
      setLogoutClicked(false);
    } catch (error) {
      console.error('Failed to logout:', error);
      setLogoutClicked(false); // Reset if there's an error
    }
  };

  // If initializing, show loading indicator
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Monitor className="h-12 w-12 mx-auto mb-4 animate-pulse" />
          <p className="text-xl">Initializing session...</p>
        </div>
      </div>
    );
  }

  // Show loading screen when logout is clicked
  if (logoutClicked) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center h-screen z-50">
        <Loader className="w-8 h-8 mb-2 text-blue-400 animate-spin" /> 
        <p className="text-blue-400">Logging out...</p>
      </div>
    );
  }

  return (
    <div>
      {authUser?.session.online ? (
        activeSession && (
          <FloatingTimer
            session={activeSession}
            onLogout={handleEndSession}
          />
        )
      ) : (
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white py-2 px-4 rounded-lg"
        >
          Logout
        </button>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        data={confirmationData}
        onCancel={confirmationData.title !== 'Session Expired' ? handleCancelLogout : undefined}
      />
    </div>
  );
}
