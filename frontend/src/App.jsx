import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "./store/auth";
import { useLabStore } from "./store/lab";
import { useAuthStatus } from "./context/authContext";
import { useNetwork } from "./context/NetworkContext";
import useLogout from "./hooks/useLogout";
import Login from "./views/login/Main";
import SetLab from "./views/set-lab/Main";
import AdminDashboard from "./views/adminDashboard/Main";
import UserDashboard from "./views/user/Main";
import LoadingScreen from "./components/LoadingScreen";
import ConfirmationModal from "./components/admin/ConfirmationModal";
import { NetworkProvider } from "./context/NetworkContext";

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.exp < Date.now() / 1000;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true;
  }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { authUser } = useAuthStatus();
  const { isOnline } = useNetwork();
  const navigate = useNavigate();
  const { logout } = useLogout();
  const [isModalOpen, setModalOpen] = useState(false);
  const token = authUser?.token || null;
  const userRole = authUser?.user?.role;

  useEffect(() => {
    const checkToken = () => {
      if (token && isTokenExpired(token)) {
        setModalOpen(true);
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 60000);
    return () => clearInterval(interval);
  }, [token]);

  if (!isOnline && !authUser) {
    return children;
  }

  if (isOnline && !authUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && isOnline && !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      {isModalOpen && (
        <ConfirmationModal
          isOpen={isModalOpen}
          data={{
            title: "Session Expired",
            message: "Your session has expired. Please log in again.",
            onConfirm: async () => {
              await logout();
              navigate("/login", { replace: true });
            },
            buttonLabel: "OK",
            showCancel: false
          }}
        />
      )}
      {children}
    </>
  );
};

function App() {
  const { initializeLab, isLabSet, labId, computerId } = useLabStore();
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(0);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState(null);
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
  const setLabId = useLabStore((state) => state.setLabId);
  const [valuesString, setValuesString] = useState('');

  // useEffect(() => {
  //   initializeLab();
  // }, [initializeLab]);



  useEffect(() => {
    const fetchLab = async () => {
      if (valuesString) {
        try {
          const response = await fetch(`${API_BASE_URL}/lab/${computerId}`, {
            method: 'GET',
            headers: {
             'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          if (data.computerId === valuesString) {
            setLabId(data.name);
            navigate('/login');
          } else {
            setValuesString(computerId);
            navigate('/set-lab');
          }
        } catch (err) {
          console.error('Failed to fetch lab:', err);
        }
      }
    };

    fetchLab();

  }, [computerId, setLabId, navigate]);

  const initializeApplication = async () => {
    // initializeLab();
    if (window.electron) {
      window.electron.on('update-status', (data) => {
        setLoadingStatus(data.status);
        if (data.error) {
          handleInitializationError(data.status, data.error);
        } else {
          setProgress(prev => Math.min(prev + 20, 100));
        }
      });

      window.electron.on('network-status', (data) => {
        if (!data.online) {
          setShowNetworkModal(true);
        } else {
          setShowNetworkModal(false);
          initializeLab();
        }
      });

      try {
        await initializeLab();
        setProgress(100);
        setIsLoading(false);
      } catch (error) {
        handleInitializationError('Initialization Failed', error.message);
      }
    }
  };

  useEffect(() => {
    initializeApplication();

    return () => {
      if (window.electron) {
        window.electron.removeAllListeners('update-status');
        window.electron.removeAllListeners('network-status');
      }
    };
  }, []);

  const handleInitializationError = (stage, error) => {
    let modalData = {
      title: "Error",
      message: "",
      onConfirm: () => { },
      onCancel: () => { },
      buttonLabel: "Restart",
      cancelLabel: "Exit",
      showCancel: true
    };

    switch (stage) {
      case "Checking network connection...":
        setShowNetworkModal(true);
        return;

      case "Connecting to database...":
        modalData.title = "Database Connection Error";
        modalData.message = "Failed to connect to the database. Would you like to restart the application?";
        modalData.onConfirm = restartApplication;
        modalData.onCancel = () => window.electron.send('quit-app');
        break;

      case "Starting server...":
        modalData.title = "Server Error";
        modalData.message = "Failed to start the server. Would you like to restart the application?";
        modalData.onConfirm = restartApplication;
        modalData.onCancel = () => window.electron.send('quit-app');
        break;

      case "Loading main application...":
        modalData.title = "Application Error";
        modalData.message = "Failed to load the application. Would you like to restart?";
        modalData.onConfirm = restartApplication;
        modalData.onCancel = () => window.electron.send('quit-app');
        break;

      default:
        modalData.title = "Initialization Error";
        modalData.message = `An error occurred during initialization: ${error}`;
        modalData.onConfirm = restartApplication;
        modalData.onCancel = () => window.electron.send('quit-app');
    }

    setErrorModalData(modalData);
    setShowErrorModal(true);
    setIsLoading(true);
    setProgress(0);
  };

  const restartApplication = async () => {
    setShowErrorModal(false);
    setIsLoading(true);
    setProgress(0);
    setLoadingStatus('Restarting...');
    await window.electron.invoke('restart-app');
  };

  const handleNetworkModalConfirm = () => {
    setShowNetworkModal(false);
    navigate('/login');
  };

  const handleNetworkModalCancel = async () => {
    setIsCheckingNetwork(true);
    setLoadingStatus('Checking network connection...');

    try {
      const status = await window.electron.invoke('check-network');
      if (status.online) {
        setShowNetworkModal(false);
        setIsLoading(true);
        setProgress(0);
        initializeApplication();
      } else {
        setShowNetworkModal(true);
      }
    } catch (error) {
      console.error('Failed to check network status:', error);
      setShowNetworkModal(true);
    } finally {
      setIsCheckingNetwork(false);
    }
  };

  if (isLoading || progress < 100 || isCheckingNetwork) {
    return (
      <>
        <LoadingScreen status={loadingStatus} progress={progress} />
        {showNetworkModal && !isCheckingNetwork && (
          <ConfirmationModal
            isOpen={showNetworkModal}
            data={{
              title: "Network Warning",
              message: "No internet connection available. Would you like to continue in offline mode?",
              onConfirm: handleNetworkModalConfirm,
              onCancel: handleNetworkModalCancel,
              buttonLabel: "Continue Offline",
              cancelLabel: "Try Again"
            }}
          />
        )}
        {showErrorModal && errorModalData && (
          <ConfirmationModal
            isOpen={showErrorModal}
            data={errorModalData}
          />
        )}
      </>
    );
  }

  return (
    <NetworkProvider>
      <div className="app-container">
        <Routes>
          <Route
            path="/loading"
            element={<LoadingScreen status={loadingStatus} progress={progress} />}
          />
          <Route
            path="/set-lab"
            element={
              !isLabSet || !labId ? (
                <SetLab computerId={computerId} />
              ) : (
                <Navigate to={user ? `/${user.role}` : "/login"} replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              progress !== 100 ? (
                <Navigate to="/loading" replace />
              ) : !user && isLabSet && labId ? (
                <Login />
              ) : (
                <Navigate
                  to={!isLabSet || !labId ? "/set-lab" : `/${user.role}`}
                  replace
                />
              )
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={["user"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<Navigate to={!user ? "/login" : `/${user.role}`} replace />}
          />
        </Routes>
      </div>
    </NetworkProvider>
  );
}

export default App;