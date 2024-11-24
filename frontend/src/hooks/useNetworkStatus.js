import { useState, useEffect, useCallback } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);

  const checkNetwork = useCallback(async () => {
    if (!window.electron || isChecking) return;
    
    setIsChecking(true);
    setError(null);
    
    try {
      const status = await window.electron.invoke('check-network');
      console.log("te");

      console.log(status.online);
      
      
      setIsOnline(status.online);
      return status;
    } catch (err) {
      setError(err.message);
      setIsOnline(false);
      return { online: false, message: err.message };
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  const enableNetwork = useCallback(async () => {
    if (!window.electron || isChecking) return;
    
    setIsChecking(true);
    setError(null);
    
    try {
      const status = await window.electron.invoke('enable-network');
      console.log("st");
      
      setIsOnline(status.online);
      return status;
    } catch (err) {
      setError(err.message);
      return { online: false, message: err.message };
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  useEffect(() => {
    const handleNetworkStatus = (status) => {
      setIsOnline(status.online);
      setError(status.online ? null : status.message);
    };

    if (window.electron) {
      window.electron.on('network-status', handleNetworkStatus);
      window.electron.on('network-recheck-status', handleNetworkStatus);
      checkNetwork();
    }

    return () => {
      if (window.electron) {
        window.electron.removeAllListeners('network-status');
        window.electron.removeAllListeners('network-recheck-status');
      }
    };
  }, [checkNetwork]);

  return {
    isOnline,
    isChecking,
    error,
    checkNetwork,
    enableNetwork
  };
};