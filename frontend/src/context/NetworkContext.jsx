import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from "../components/admin/ConfirmationModal";
import { AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { useAuthStatus } from './authContext';
import { useSession } from '../hooks/useSession';
import { useLabStore } from '../store/lab';

const NetworkContext = createContext(undefined);

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const navigate = useNavigate();
  const { authUser } = useAuthStatus();
  const { activeSession } = useSession();
  const { labId } = useLabStore();

  console.log(activeSession);
  

  useEffect(() => {
    if (authUser?.session.online !== false && activeSession?.labId === labId) {
      
    

    const handleNetworkChange = async () => {
      try {
        const status = await window.electron?.invoke('check-network');
        handleNetworkStatus(status);
      } catch (error) {
        console.error('Network check failed:', error);
        setIsOnline(false);
      }
    };

    if (window.electron) {
      window.electron.on('network-status', handleNetworkStatus);
      handleNetworkChange();
    }

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      if (window.electron) {
        window.electron.removeAllListeners('network-status');
      }
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }
  }, [authUser]);

  const handleNetworkStatus = (status) => {
    const previousState = isOnline;
    setIsOnline(status.online);

    if (!status.online && previousState) {
      setShowOfflineModal(true);
    } else if (status.online && !previousState) {
      setShowOnlineModal(true);
    }
  };

  const handleOfflineConfirm = () => {
    setShowOfflineModal(false);
    navigate('/user');
  };

  const handleTryAgain = async () => {
    setIsCheckingNetwork(true);
    setLoadingStatus('Checking network connection...'); 
    setIsLoading(true);
    setProgress(0);
    initializeApplication();

    try {
      const status = await window.electron.invoke('check-network');

      if (status.online) {
        setShowOfflineModal(false);
        navigate('/login', { replace: true });

      } else {
        setShowOfflineModal(true);
      }
    } catch (error) {
      console.error('Failed to check network status:', error);
      setShowOfflineModal(true);
    } finally {
      setIsCheckingNetwork(false);
    }
  }

  const handleOnlineConfirm = () => {
    setShowOnlineModal(false);
    navigate('/login', { replace: true });
  };

  const handleOfflineCancel = () => {
    setShowOfflineModal(false);
    // Re-check network status after cancel
    window.electron?.invoke('check-network');
  };

  const handleOnlineCancel = () => {
    setShowOnlineModal(false);
    // Stay on current page if user cancels
  };

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
      <AnimatePresence>
        {showOfflineModal && (
          <ConfirmationModal
            isOpen={true}
            data={{
              title: "Network Warning",
              message: "No internet connection available. Would you like to continue without logging in?",
              onConfirm: handleOfflineConfirm,
              onCancel: handleTryAgain,
              buttonLabel: "Continue Offline",
              cancelLabel: "Try Again"
            }}
            onCancel={handleOfflineCancel}
          />
        )}
        {showOnlineModal && (
          <ConfirmationModal
            isOpen={true}
            data={{
              title: "Network Connection Restored",
              message: "Internet connection is now available. Would you like to go to the login page?",
              onConfirm: handleOnlineConfirm,
              buttonLabel: "Go to Login"
            }}
            onCancel={handleOnlineCancel}
          />
        )}
      </AnimatePresence>
    </NetworkContext.Provider>
  );
};

NetworkProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};