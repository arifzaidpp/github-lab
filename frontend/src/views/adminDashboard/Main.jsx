import React, { useEffect, useState } from "react";
import { useSession } from "../../hooks/useSession";
import {
  LogOut,
  Plus,
  Settings,
  Monitor,
  Search,
  RefreshCcw,
  Loader,
  ChevronDown,
} from "lucide-react";
import { format, eachDayOfInterval } from "date-fns";
import AnalyticsOverview from "../../components/admin/AnalyticsOverview";
import AddUserModal from "../../components/admin/AddUserModal";
import UsersList from "../../components/admin/UsersList";
import SessionsList from "../../components/admin/SessionsList";
import PurposeManagement from "../../components/admin/PurposeManagement";
import CreditManagement from "../../components/admin/CreditManagement";
import UserProfile from "../../components/admin/UserProfile";
import { motion, AnimatePresence, m } from "framer-motion";
import { useAuthStatus } from "../../context/authContext";
import useLogout from "../../hooks/useLogout";
import PrintManagement from "../../components/admin/PrintManagement";
import ConfirmationModal from "../../components/admin/ConfirmationModal";
import useDeleteImage from "../../hooks/useDeleteImage";
import DownloadPage from "../../components/admin/DownloadPage";

export default function AdminDashboard() {
  const { logout } = useLogout();
  const { sessions, allSessions, getAllSessions, getLimitedSessions } =
    useSession();
  const [users, setUsers] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [credits, setCredits] = useState([]);
  const [allCredits, setAllCredits] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPurposeManagement, setShowPurposeManagement] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Labs");

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("");
  const [searchSession, setSearchSession] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [labFilter, setLabFilter] = useState("");
  const [searchCredit, setSearchCredit] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [prints, setPrints] = useState([]);
  const [searchPrints, setSearchPrint] = useState("");
  const [showPrintForm, setShowPrintForm] = useState(false);
  const [allPrints, setAllPrints] = useState([]);
  const [userPrints, setUserPrints] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [confirmationData, setConfirmationData] = useState({});
  const [allLabs, setAllLabs] = useState([]);
  const {
    deleteImage,
    loading: deleteLoading,
    error: deleteError,
  } = useDeleteImage();
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

  const authUser = useAuthStatus();

  useEffect(() => {
    if (authUser && window.electron) {
      window.electron.invoke("enter-fullscreen-admin");
    }
  }, [authUser]);

  const handleLogout = async () => {
    await logout();
  };

  const [userSessions, setUserSessions] = useState([]);
  const [userCredits, setUserCredits] = useState([]);

  const handleUserClick = (user) => {
    setUserSessions(
      allSessions.filter(
        (session) => session.admissionNumber === user.admissionNumber
      )
    );
    setUserCredits(credits.filter((credit) => credit.userId._id === user._id));
    setUserPrints(prints.filter((print) => print.userId._id === user._id));
    setSelectedUser(user); // Set the selected user
    setShowUser(true); // Show the user profile modal
  };

  const handleOnEditUser = (user) => {
    fetchUsers();
    setSelectedUser(user);
  };

  const fetchWithToken = async (url, options = {}) => {
    const token = authUser.authUser.token;

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

  const fetchUsers = async () => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/auth/users`, {
        method: "GET",
      });
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchPurposes = async () => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/purposes`, {
        method: "GET",
      });
      setPurposes(data);
    } catch (error) {
      console.error("Failed to fetch purposes:", error);
    }
  };

  const deletePurpose = async (purposeId) => {
    try {
      await fetchWithToken(`${API_BASE_URL}/purposes/${purposeId}`, {
        method: "DELETE",
      });
      fetchPurposes();
    } catch (error) {
      console.error("Failed to delete purpose:", error);
    }
  };

  const handleOnDeleteUser = (userId, imageId) => {
    setModalOpen(true);
    setConfirmationData({
      title: "Delete User",
      message: "Are you sure you want to delete this user?",
      onConfirm: () => handleConfirmDeleteUser(userId, imageId),
      buttonLabel: "Delete",
    });
  };

  const handleConfirmDeleteUser = async (userId, imageId) => {
    setLoading(true);
    setModalOpen(false);
    try {
      await fetchWithToken(`${API_BASE_URL}/auth/delete/${userId}`, {
        method: "DELETE",
      });
      if (imageId) {
        await deleteImage(imageId);
      }
      fetchUsers();
      fetchAllCredits();
      fetchAllPrints();
      fetchPrints();
      fetchCredits();
      getAllSessions();
      getLimitedSessions();
      setShowUser(false);
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeleteUser = () => setModalOpen(false);

  const fetchCredits = async () => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/credits`, {
        method: "GET",
      });
      setCredits(data.credits);
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  };

  const fetchAllCredits = async () => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/credits/all`, {
        method: "GET",
      });
      setAllCredits(data);
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    }
  };

  const handleEditPurpose = async (purposeData) => {
    try {
      await fetchWithToken(`${API_BASE_URL}/purposes/${purposeData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purposeData),
      });
      fetchPurposes();
    } catch (error) {
      console.error("Failed to edit purpose:", error);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      const response = await fetchWithToken(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.message !== "User created successfully") {
        throw new Error("Failed to add user");
      }

      fetchUsers();
      setShowAddUser(false);
    } catch (error) {
      console.error("Failed to add user:", error);
    }
  };

  const handleAddCredit = async (creditData) => {
    try {
      await fetchWithToken(`${API_BASE_URL}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creditData),
      });
      fetchCredits();
      fetchUsers(); // Refresh user balances
    } catch (error) {
      console.error("Failed to add credit:", error);
    }
  };

  const handleAddPurpose = async (purposeData) => {
    try {
      await fetchWithToken(`${API_BASE_URL}/purposes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(purposeData),
      });
      fetchPurposes();
    } catch (error) {
      console.error("Failed to add purpose:", error);
    }
  };

  const handleRemoveFee = async (sessionIds) => {
    try {
      await fetchWithToken(`${API_BASE_URL}/sessions/remove-fee`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionIds }),
      });
      setModalOpen(false);
      getLimitedSessions();
      getAllSessions();
      fetchCredits();
      fetchUsers();
    } catch (error) {
      console.error("Failed to remove fee:", error);
    }
  };
  const handleOnRemoveFee = (sessionIds) => {
    setModalOpen(true);
    setConfirmationData({
      title: "Remove Fee",
      message:
        "Are you sure you want to remove the fee for selected session(s)?",
      onConfirm: () => handleRemoveFee(sessionIds),
      buttonLabel: "Remove",
    });
  };

  const handleEndSession = async (session) => {
    setModalOpen(true);
    setConfirmationData({
      title: "End Session",
      message: `Are you sure you want to end session of user ad.no : ${session.admissionNumber}?`,
      onConfirm: async () => {
        try {
          await fetchWithToken(`${API_BASE_URL}/sessions/force-end`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: session._id }),
          });
          setModalOpen(false);
          getLimitedSessions();
          getAllSessions();
          fetchCredits();
          fetchUsers();
        } catch (error) {
          console.error("Failed to end session:", error);
        }
      },
      buttonLabel: "End Session",
    });
  };

  const handleCutFee = async (sessionIds) => {
    try {
      await fetchWithToken(`${API_BASE_URL}/sessions/cut-fee`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionIds }),
      });
      setModalOpen(false);
      getLimitedSessions();
      getAllSessions();
      fetchCredits();
      fetchUsers();
    } catch (error) {
      console.error("Failed to cut fee:", error);
    }
  };
  const handleOnCutFee = (sessionIds) => {
    setModalOpen(true);
    setConfirmationData({
      title: "Cut 50% of Fee",
      message:
        "Are you sure you want to cut 50% of the fee for selected session(s)?",
      onConfirm: () => handleCutFee(sessionIds),
      buttonLabel: "Cut Fee",
    });
  };

  // const handleDeleteCredit = async (creditId) => {
  //     try {
  //         await fetchWithToken(`/api/credits/${creditId}`, { method: 'DELETE' });
  //         fetchCredits();
  //         fetchUsers(); // Refresh user balances
  //     } catch (error) {
  //         console.error('Failed to delete credit:', error);
  //     }
  // };

  const handleDeleteCredit = async (creditId) => {
    setModalOpen(true);
    setConfirmationData({
      title: "Remove Credit",
      message: "Are you sure you want to remove this credit?",
      onConfirm: async () => {
        try {
          await fetchWithToken(`${API_BASE_URL}/credits/${creditId}`, {
            method: "DELETE",
          });
          fetchCredits();
          fetchUsers(); // Refresh user balances
          setModalOpen(false);
        } catch (error) {
          console.error("Failed to delete credit:", error);
        }
      },
      buttonLabel: "Remove",
    });
  };

  useEffect(() => {
    getLimitedSessions().catch(console.error);
    getAllSessions().catch(console.error);
    fetchUsers();
    fetchPurposes();
    fetchCredits();
    fetchAllCredits();
  }, [getLimitedSessions || getAllSessions]);

  // Generate all dates from 2024-11-01 to today (inclusive)
  const startDate = new Date("2024-11-01");
  const endDate = new Date();
  const allDates = eachDayOfInterval({
    start: startDate,
    end: endDate,
  }).map((date) => format(date, "MM/dd"));

  // Prepare data for the graph, ensuring every date in the range is included
  const userSessionData = allSessions.reduce((acc, session) => {
    const date = format(new Date(session.startTime), "MM/dd");
    const existing = acc.find((item) => item.date === date);
    const roundedUsageFee = parseFloat(session.usageFee.toFixed(2));
    if (existing) {
      existing.sessions += 1;
      existing.usageFee = parseFloat(
        (existing.usageFee + roundedUsageFee).toFixed(2)
      );
    } else {
      acc.push({
        date,
        sessions: 1,
        usageFee: parseFloat(session.usageFee.toFixed(2)),
      });
    }

    return acc;
  }, []);

  // Prepare data for credits
  const userCreditsData = allCredits.reduce((acc, credit) => {
    const date = format(new Date(credit.date), "MM/dd");
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.credits += credit.amount;
    } else {
      acc.push({
        date,
        credits: credit.amount,
      });
    }
    return acc;
  }, []);

  // Prepare data for prints
  const userPrintsData = allPrints.reduce((acc, print) => {
    const date = format(new Date(print.date), "MM/dd");
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.prints += print.pages;
    } else {
      acc.push({
        date,
        prints: print.pages,
      });
    }
    return acc;
  }, []);

  // Create final data by ensuring all dates are included
  const mergedData = allDates.map((date) => {
    const session = userSessionData.find((item) => item.date === date);
    const credit = userCreditsData.find((item) => item.date === date);
    const print = userPrintsData.find((item) => item.date === date);

    return {
      date,
      sessions: session ? session.sessions : 0,
      usageFee: session ? session.usageFee : 0,
      credits: credit ? credit.credits : 0,
      prints: print ? print.prints : 0,
    };
  });

  // Filtered users based on search term and filter option
  const filteredUsers = users.filter((user) => {
    return (
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.admissionNumber.includes(searchTerm)) &&
      (filter ? user.class.toString() === filter : true)
    );
  });

  // Filtered sessions based on search term and filter option
  const filteredSessions = (() => {
    // Step 1: Filter the main `sessions` array based on search and filter criteria
    const mainFilteredSessions = sessions.filter((session) => {
      const date = format(new Date(session.startTime), "PPp").toLowerCase();
      const matchesSearch =
        session.admissionNumber
          .toLowerCase()
          .includes(searchSession.toLowerCase()) ||
        date.includes(searchSession.toLowerCase());
      const matchesFilter =
        (sessionFilter ? session.purpose === sessionFilter : true) &&
        (labFilter ? session.labId === labFilter : true);

      return matchesSearch && matchesFilter;
    });

    // Step 2: If no matches in `sessions`, search in `allSessions`
    if (mainFilteredSessions.length === 0) {
      const fallbackFilteredSessions = allSessions.filter((session) => {
        const date = format(new Date(session.startTime), "PPp").toLowerCase();
        const matchesSearch =
          session.admissionNumber
            .toLowerCase()
            .includes(searchSession.toLowerCase()) ||
          date.includes(searchSession.toLowerCase());
        const matchesFilter =
          (sessionFilter ? session.purpose === sessionFilter : true) &&
          (labFilter ? session.labId === labFilter : true);

        return matchesSearch && matchesFilter;
      });

      // Step 3: If matches found in `allSessions`, return them
      if (fallbackFilteredSessions.length > 0) {
        return fallbackFilteredSessions;
      }
    }

    // Step 4: If no matches in both, return an empty array
    return mainFilteredSessions.length > 0 ? mainFilteredSessions : [];
  })();

  // Set up filtered credits based on search and filter criteria
  const filteredCredits = (() => {
    const mainFilteredCredits = credits.filter((credit) => {
      const date = format(new Date(credit.date), "PPp").toLowerCase();
      const matchesSearch =
        credit.userId.name.toLowerCase().includes(searchCredit.toLowerCase()) ||
        credit.userId.admissionNumber
          .toLowerCase()
          .includes(searchCredit.toLowerCase()) ||
        date.includes(searchCredit.toLowerCase());
      return matchesSearch;
    });

    if (mainFilteredCredits.length === 0) {
      const fallbackFilteredCredits = allCredits.filter((credit) => {
        const date = format(new Date(credit.date), "PPp").toLowerCase();
        const matchesSearch = credit.userId.name
          .toLowerCase()
          .includes(
            searchCredit.toLowerCase() ||
            credit.userId.admissionNumber
              .toLowerCase()
              .includes(searchCredit.toLowerCase()) ||
            date.includes(searchCredit.toLowerCase())
          );
        return matchesSearch;
      });

      if (fallbackFilteredCredits.length > 0) {
        return fallbackFilteredCredits;
      }
    }

    return mainFilteredCredits.length > 0 ? mainFilteredCredits : [];
  })();

  const fetchPrints = async () => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/print`, {
        method: "GET",
      });
      setPrints(data.prints);
    } catch (error) {
      console.error("Failed to fetch prints:", error);
    }
  };

  const fetchAllPrints = async () => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/print/all`, {
        method: "GET",
      });
      setAllPrints(data);
    } catch (error) {
      console.error("Failed to fetch prints:", error);
    }
  };

  const fetchAllLabs = async () => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/lab/`, {
        method: "GET",
      });
      setAllLabs(data);
    } catch (error) {
      console.error("Failed to fetch labs:", error);
    }
  };

  const handleAddPrint = async (printData) => {
    try {
      await fetchWithToken(`${API_BASE_URL}/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(printData),
      });
      fetchPrints();
      fetchUsers(); // Refresh user balances
    } catch (error) {
      console.error("Failed to add print:", error);
    }
  };

  // const handleDeletePrint = async (printId) => {
  //     try {
  //         await fetchWithToken(`/api/print/${printId}`, { method: 'DELETE' });
  //         fetchPrints();
  //         fetchUsers(); // Refresh user balances
  //     } catch (error) {
  //         console.error('Failed to delete print:', error);
  //     }
  // };

  const handleDeletePrint = async (printId) => {
    setModalOpen(true);
    setConfirmationData({
      title: "Remove Print",
      message: "Are you sure you want to remove this print?",
      onConfirm: async () => {
        try {
          await fetchWithToken(`${API_BASE_URL}/print/${printId}`, {
            method: "DELETE",
          });
          fetchPrints();
          fetchUsers(); // Refresh user balances
          setModalOpen(false);
        } catch (error) {
          console.error("Failed to delete print:", error);
        }
      },
      buttonLabel: "Remove",
    });
  };

  useEffect(() => {
    getLimitedSessions().catch(console.error);
    getAllSessions().catch(console.error);
    fetchUsers();
    fetchPurposes();
    fetchCredits();
    fetchAllCredits();
    fetchPrints();
    fetchAllLabs();
    fetchAllPrints();
  }, [getLimitedSessions || getAllSessions]);

  // Set up filtered prints based on search and filter criteria
  const filteredPrints = (() => {
    const mainFilteredPrints = prints.filter((print) => {
      const date = format(new Date(print.date), "PPp").toLowerCase();
      const matchesSearch =
        print.userId.name.toLowerCase().includes(searchPrints.toLowerCase()) ||
        print.userId.admissionNumber
          .toLowerCase()
          .includes(searchPrints.toLowerCase()) ||
        date.includes(searchPrints.toLowerCase());
      return matchesSearch;
    });

    if (mainFilteredPrints.length === 0) {
      const fallbackFilteredPrints = allPrints.filter((print) => {
        const date = format(new Date(print.date), "PPp").toLowerCase();
        const matchesSearch =
          print.userId.name
            .toLowerCase()
            .includes(searchPrints.toLowerCase()) ||
          print.userId.admissionNumber
            .toLowerCase()
            .includes(searchPrints.toLowerCase()) ||
          date.includes(searchPrints.toLowerCase());
        return matchesSearch;
      });

      if (fallbackFilteredPrints.length > 0) {
        return fallbackFilteredPrints;
      }
    }

    return mainFilteredPrints.length > 0 ? mainFilteredPrints : [];
  })();

  const [creditPart, setCreditPart] = useState();
  const [printPart, setPrintPart] = useState();
  const [sessionPart, setSessionPart] = useState();

  useEffect(() => {
    if (activeTab) {
      if (activeTab === "Labs") {
        setCreditPart(false);
        setPrintPart(false);
        setSessionPart(false);
      } else if (activeTab === "users") {
        setCreditPart(false);
        setPrintPart(false);
        setSessionPart(false);
      } else if (activeTab === "credits") {
        setCreditPart(true);
        setPrintPart(false);
        setSessionPart(false);
      } else if (activeTab === "prints") {
        setCreditPart(false);
        setPrintPart(true);
        setSessionPart(false);
      } else if (activeTab === "sessions") {
        setCreditPart(false);
        setPrintPart(false);
        setSessionPart(true);
      } else if (activeTab === "Download") {
        setCreditPart(false);
        setPrintPart(false);
        setSessionPart(false);
      }
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-white">
              Lab Management Admin
            </h1>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPurposeManagement(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-100 hover:bg-blue-600/30 transition-colors duration-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Purposes
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-lg text-red-100 hover:bg-red-600/30 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </nav>
      {loading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center h-screen z-50">
          <Loader className="w-8 h-8 mb-2 text-blue-400 animate-spin" />
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <AnalyticsOverview
          key={`${creditPart}-${printPart}-${sessionPart}`} // Using the state as a key to trigger re-render
          mergedData={mergedData}
          creditPart={creditPart}
          printPart={printPart}
          sessionPart={sessionPart}
        />

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          {["Labs", "users", "sessions", "credits", "prints", "Download"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${activeTab === tab
                  ? "bg-blue-600/20 border border-blue-500/30 text-blue-100"
                  : "text-gray-400 hover:text-white"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "Labs" && (
            <motion.div
              key="labs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Lab Status
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchAllLabs}
                  className="inline-flex items-center px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200"
                >
                  Refresh Labs Status
                  <RefreshCcw
                    size={20}
                    className="text-blue-300 ml-3 cursor-pointer hover:text-blue-400 transition-colors"
                  />
                </motion.button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allLabs.map((lab) => (
                  <div
                    key={lab._id}
                    className="relative p-4 bg-white/5 backdrop-blur-lg border border-white/10 overflow-hidden hover:bg-white/10 transition-colors duration-200 rounded-lg shadow-lg"
                  >
                    <div className="absolute top-2 right-2">
                      {lab.status === true && (
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <Monitor className="h-10 w-10 text-white mb-2" />
                      <h3 className="text-white text-lg font-semibold">
                        {lab.name}
                      </h3>
                      <p
                        className={`text-sm ${lab.status === true
                            ? "text-green-400"
                            : "text-red-400"
                          }`}
                      >
                        {lab.status === true ? "Active" : "Inactive"}
                      </p>
                      {/* {lab.status === true && (
                        <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleLabClick(lab)}
                        className="mt-2 px-2 py-1 bg-red-600/20 border border-red-500/30 rounded-lg text-red-100 hover:bg-red-600/30 transition-colors duration-200"
                      >
                        Block Lab
                      </motion.button>                      
                      )} */}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  User Management
                </h2>
                <div className="flex items-center space-x-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200 focus:outline-none"
                    />
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative inline-block">
                    <div className="relative inline-block w-full">
                      <div className="relative">
                        <select
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          className="w-full px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200 focus:outline-none appearance-none pr-10"
                        >
                          <option value="">All Class</option>
                          {users.map((user) => (
                            <option key={user._id} value={user.class}>
                              {user.class}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-green-100" />
                      </div>
                    </div>
                  </div>

                  {/* Add New User Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddUser(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New User
                  </motion.button>
                </div>
              </div>

              <UsersList users={filteredUsers} onUserClick={handleUserClick} />
            </motion.div>
          )}

          {activeTab === "sessions" && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Session History
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by ad.no or date"
                      value={searchSession}
                      onChange={(e) => setSearchSession(e.target.value)}
                      className="pl-10 pr-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200 focus:outline-none"
                    />
                  </div>
                  <div className="relative inline-block">
                    <div className="relative inline-block w-full">
                      <div className="relative">
                        <select
                          value={sessionFilter}
                          onChange={(e) => setSessionFilter(e.target.value)}
                          className="w-full px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200 focus:outline-none appearance-none pr-10"
                        >
                          <option value="">All Purposes</option>
                          {purposes.map((purpose) => (
                            <option key={purpose._id} value={purpose.name}>
                              {purpose.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-green-100" />
                      </div>
                    </div>
                  </div>
                  <div className="relative inline-block">
                    <div className="relative inline-block w-full">
                      <div className="relative">
                        <select
                          value={labFilter}
                          onChange={(e) => setLabFilter(e.target.value)}
                          className="w-full px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200 focus:outline-none appearance-none pr-10"
                        >
                          <option value="">All Labs</option>
                          {allLabs.map((lab) => (
                            <option key={lab._id} value={lab.name}>
                              {lab.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-green-100" />
                      </div>
                    </div>
                  </div>

                  {/* Reload Sessions Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      getLimitedSessions().catch(console.error);
                      getAllSessions().catch(console.error);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200 focus:outline-none"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Reload Sessions
                  </motion.button>
                </div>
              </div>

              <SessionsList
                sessions={filteredSessions}
                onRemoveFee={handleOnRemoveFee}
                onCutFee={handleOnCutFee}
                onEndSession={handleEndSession}
              />
            </motion.div>
          )}

          {activeTab === "credits" && (
            <motion.div
              key="credits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Credit Management
                </h2>
                <div className="flex items-center space-x-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by user name, ad.no, or date"
                      value={searchCredit}
                      onChange={(e) => setSearchCredit(e.target.value)}
                      className="pl-10 pr-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200 focus:outline-none"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Credit
                  </motion.button>
                </div>
              </div>
              {/* Display filtered credits */}
              <CreditManagement
                credits={filteredCredits}
                users={users}
                onAddCredit={handleAddCredit}
                onRefresh={fetchCredits}
                onDelete={handleDeleteCredit}
                showAddForm={showAddForm}
                setShowAddForm={setShowAddForm}
              />
            </motion.div>
          )}

          {activeTab === "prints" && (
            <motion.div
              key="prints"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Prints</h2>
                <div className="flex items-center space-x-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by user name, ad.no, or date"
                      value={searchPrints}
                      onChange={(e) => setSearchPrint(e.target.value)}
                      className="pl-10 pr-3 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200 focus:outline-none"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPrintForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-100 hover:bg-green-600/30 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Print
                  </motion.button>
                </div>
              </div>
              {/* Display filtered Prints */}
              <PrintManagement
                prints={filteredPrints}
                users={users}
                onAddPrint={handleAddPrint}
                onRefresh={fetchPrints}
                onDelete={handleDeletePrint}
                showAddForm={showPrintForm}
                setShowAddForm={setShowPrintForm}
              />
            </motion.div>
          )}

          {activeTab === "Download" && (
            <motion.div
              key="download"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Download Data</h2>
              </div>
              <DownloadPage users={users} />

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showAddUser && (
          <AddUserModal
            onClose={() => {
              setShowAddUser(false);
              setSelectedUser(null);
            }}
            selectedUser={selectedUser}
            onSubmit={handleAddUser}
          />
        )}

        {showPurposeManagement && (
          <PurposeManagement
            purposes={purposes}
            onClose={() => setShowPurposeManagement(false)}
            onAddPurpose={handleAddPurpose}
            onRefresh={fetchPurposes}
            onEdit={handleEditPurpose}
            onDelete={deletePurpose}
          />
        )}

        {showUser && (
          <UserProfile
            user={selectedUser}
            allSessions={userSessions}
            allCredits={userCredits}
            allPrints={userPrints}
            onClose={() => {
              setSelectedUser(null);
              setShowUser(false);
            }}
            onEditUserData={handleOnEditUser}
            onDelete={handleOnDeleteUser}
          />
        )}

        {isModalOpen && (
          <ConfirmationModal
            isOpen={isModalOpen}
            data={confirmationData}
            onCancel={handleCancelDeleteUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
