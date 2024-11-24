import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, Edit2, Trash2, Plus, X, AlertCircle, Image, Upload, Loader } from 'lucide-react';
import useUploadImage from "../../hooks/useUploadImage";
import useDeleteImage from "../../hooks/useDeleteImage";
import { format, eachDayOfInterval, parse } from 'date-fns';
import ApexCharts from 'react-apexcharts';
import { useAuthStatus } from '../../context/authContext';

export default function UserProfile({
  user,
  allSessions,
  allCredits,
  allPrints,
  onClose,
  onEditUserData,
  onDelete
}) {

  const [activeTab, setActiveTab] = useState('sessions');

  // Generate all dates from 2024-11-01 to today (inclusive)
  const startDate = new Date('2024-11-01');
  const endDate = new Date();
  const allDates = eachDayOfInterval({
    start: startDate,
    end: endDate,
  }).map(date => format(date, 'MM/dd'));

  // Prepare data for the graph, ensuring every date in the range is included
  const userSessionData = allSessions.reduce((acc, session) => {

    const date = format(new Date(session.startTime), 'MM/dd');
    const existing = acc.find(item => item.date === date);
    const roundedUsageFee = parseFloat(session.usageFee.toFixed(2));
    if (existing) {
      existing.sessions += 1;
      existing.usageFee = parseFloat((existing.usageFee + roundedUsageFee).toFixed(2));
    } else {
      acc.push({
        date,
        sessions: 1,
        usageFee: parseFloat(session.usageFee.toFixed(2))
      });
    }

    return acc;
  }, []);

  // Prepare data for credits
  const userCreditsData = allCredits.reduce((acc, credit) => {
    const date = format(new Date(credit.date), 'MM/dd');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.credits += credit.amount;
    } else {
      acc.push({
        date,
        credits: credit.amount
      });
    }
    return acc;
  }, []);

  // Prepare data for prints
  const userPrintsData = allPrints.reduce((acc, print) => {
    const date = format(new Date(print.date), 'MM/dd');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.prints += print.pages;
    } else {
      acc.push({
        date,
        prints: print.pages
      });
    }
    return acc;
  }, []);

  // Create final data by ensuring all dates are included
  const mergedData = allDates.map(date => {
    const session = userSessionData.find(item => item.date === date);
    const credit = userCreditsData.find(item => item.date === date);
    const print = userPrintsData.find(item => item.date === date);

    return {
      date,
      sessions: session ? session.sessions : 0,
      usageFee: session ? session.usageFee : 0,
      credits: credit ? credit.credits : 0,
      prints: print ? print.prints : 0
    };
  });

  // Extract the data for the chart
  const dates = mergedData.map(d => d.date);
  const sessions = mergedData.map(d => d.sessions);
  const usageFee = mergedData.map(d => d.usageFee);
  const credits = mergedData.map(d => d.credits);
  const prints = mergedData.map(d => d.prints);

  // Chart configuration
  const chartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      zoom: {
        enabled: true,
        type: 'xy', // Zoomable on both axes
        mouseWheel: {
          enabled: true, // Enable zooming on mouse wheel
          zoomedArea: {
            fill: { color: 'rgba(0, 0, 0, 0.1)' },
            stroke: { color: '#000' },
          }
        },
        // Enable zooming on both x and y axes, to dynamically adjust zoom
      }
    },
    colors: ['#3b82f6', '#10b981', '#f97316', '#f43f5e'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' },
    xaxis: {
      categories: dates,
      labels: { style: { colors: '#94a3b8' } },
      min: '11/01/2024', // Start from the given date
      max: format(new Date(), 'MM/dd'), // Up to today
    },
    yaxis: {
      min: 0, // Ensure Y-axis starts from 0
      labels: { style: { colors: '#94a3b8' } },
      show: true, // Always show the y-axis, even when no data exists
    },
    tooltip: {
      theme: 'dark',
    },
    legend: {
      labels: {
        colors: ['#3b82f6', '#10b981', '#f97316', '#f43f5e'], // Set the colors of "Sessions" and "Usage Fee (₹)" text
      },
      fontSize: '14px',
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.2)', // Set line color with opacity
      strokeDashArray: 0, // Remove dashes for solid lines (optional)
    },
  };

  // Define chart series
  const chartSeries = [
    { name: 'Sessions', data: sessions },
    { name: 'Credits', data: credits },
    { name: 'Usage Fee (₹)', data: usageFee },
    { name: 'Prints', data: prints },
  ];


  const [editUser, setEditUser] = useState(false);
  const [editData, setEditData] = useState("");
  const [data, setData] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const extractPublicId = (imageUrl) => {
    // Regex to match everything after 'upload/' until the file extension
    const regex = /upload\/(?:[^\/]+\/)?([^\.]+)/;
    const match = imageUrl.match(regex);

    // If there's a match, return the captured group (the public_id), else return null
    return match ? match[1] : null;
  };

  const [publicIdEdit, setPublicIdEdit] = useState(null);

  const imageUrl = user.imageUrl;

  useEffect(() => {

    if (imageUrl) {
      const extractedPublicId = extractPublicId(imageUrl);
      setPublicIdEdit(extractedPublicId);
    } else {
      console.log('No public_id found');
    }
  }, [imageUrl])



  const handleDelete = async () => {
    if (publicIdEdit || publicId) {
      onDelete(user._id, publicIdEdit || publicId);
    } else {
      onDelete(user._id)
    }
  }

  const onEdit = (data) => {
    setEditUser(true);
    setEditData(data);
    setData(data === "Class" ? user.class : data === "name" ? user.name : data === "Password" ? "" : data === "image" ? user.imageUrl : "");
    if (data === "image") {
      if (user.imageUrl) {
        const imageUrl = user.imageUrl;
        const extractedPublicId = extractPublicId(imageUrl);
        if (extractedPublicId) {
          setPublicIdEdit(extractedPublicId);
        } else {
          console.log('No public_id found');
        }
      }
      setImagePreview(user.imageUrl);
    }
  };


  const authUser = useAuthStatus();

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

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (data === "" && editData !== "image") return;

    if (editData === "Password") {
      if (data !== confirmPassword || oldPassword === "") {
        setError('Passwords do not match');
        <motion.div
          animate={{ x: [-10, 10, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        />
        return;
      }
    }

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

    try {
      const response = await fetchWithToken(`${API_BASE_URL}/auth/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [editData === "Class" ? "class" : editData === "name" ? "name" : editData === "Password" ? "password" : editData === "image" ? "image" : ""]:
            data,
          ...(editData === "Password" ? { oldPassword } : {}),
          ...(editData === "image" && !imagePreview ? { imageUrl: null } : {}),
          ...(editData === "image" && imagePreview ? { imageUrl: imagePreview } : {}),
        }),
      });

      if (!response) {
        throw new Error('Failed to edit user');
      }
      if (response.error) {
        setError(response.error);
        return;
      }
      user = response.user;
      onEditUserData(user);

      setEditUser(false);
      setEditData("");
      setError("");
      setData("");
      setOldPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error('Failed to edit user:', error);
    }
  };


  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageName, setImageName] = useState('');

  const { uploadImage, loading: uploadLoading, error: uploadError, data: uploadData, publicId } = useUploadImage();
  const { deleteImage, deleteLoading, error: deleteError } = useDeleteImage();

  useEffect(() => {
    if (uploadData) {
      setImagePreview(uploadData);
    }
  }, [uploadData]);

  const handleImageChange = async (e) => {
    if (e.target.files?.[0]) {
      if (image) {
        setError('Please remove the existing image before uploading a new one.');
        return;
      }

      const newImage = e.target.files[0];
      setImageName(newImage.name);

      try {
        const uploadedImage = await uploadImage(newImage);
        setImage(uploadedImage);
        setData(uploadedImage);
      } catch (err) {
        setError('Failed to upload new image');
      }
    }
  };

  const handleRemoveImage = async () => {
    if (publicId || publicIdEdit) {
      await deleteImage(publicId || publicIdEdit);
      setImagePreview(null);
      setImageName('');
      setData(null); // Ensure data is set to null to indicate removal
      setImage(null);
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-40"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white/10 border border-white/20 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-end space-x-4 mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="p-2 rounded-lg bg-red-500/20 border border-red-400/30 text-red-100 hover:bg-red-500/30"
          >
            <Trash2 className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 border border-white/30 text-white hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 via-blue-600 to-indigo-700 rounded-xl p-8 mb-8 flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-6 max-w-[39rem]">
            <div className="relative group w-[158px]">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.name}
                  className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="h-10 w-10 text-white" />
                </div>
              )}

              {/* Camera icon overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                <Image className="text-white h-6 w-6" onClick={() => onEdit("image")} />
              </div>
            </div>

            <div className="space-y-4 w-full">
              {/* User Name Section */}
              <div className="grid grid-cols-[auto_10px_1fr_auto] items-center gap-2 text-white">
                <h2 className="text-lg font-semibold text-indigo-100">User Name</h2>
                <span className="text-indigo-100">:</span>
                <span className="text-xl font-bold line-clamp-1">{user.name}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onEdit("name")}
                  className="ml-2 p-1 rounded-full bg-white/20 border border-white/30 text-white hover:bg-white/30 transition"
                >
                  <Edit2 className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Admission Number Section */}
              <div className="grid grid-cols-[auto_10px_1fr] items-center gap-2 text-white">
                <h2 className="text-sm font-medium text-indigo-100">Admission No</h2>
                <span className="text-indigo-100">:</span>
                <p className="font-medium text-lg">{user.admissionNumber}</p>
              </div>

              {/* Class Section */}
              <div className="grid grid-cols-[auto_10px_1fr_auto] items-center gap-2 text-white">
                <h2 className="text-sm font-medium text-indigo-100">Class</h2>
                <span className="text-indigo-100">:</span>
                <span className="text-lg font-medium">{user.class}</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onEdit("Class")}
                  className="ml-2 p-1 rounded-full bg-white/20 border border-white/30 text-white hover:bg-white/30 transition"
                >
                  <Edit2 className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit("Password")}
              className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-400/30 text-yellow-100 hover:bg-yellow-500/30 shadow-md"
            >
              Change Password
            </motion.button>
          </div>
        </div>


        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-sm text-blue-200 mb-1">Total Usage</p>
            {(() => {
              const hours = Math.floor(user.totalUsage / 3600000);
              const minutes = Math.floor((user.totalUsage % 3600000) / 60000);
              const seconds = Math.floor((user.totalUsage % 60000) / 1000);

              // Format the duration
              const duration = hours > 0
                ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")} hours`
                : `${minutes}:${seconds.toString().padStart(2, "0")} mins`;

              return <p className="text-2xl font-bold text-white">{duration}</p>;
            })()}

          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-sm text-blue-200 mb-1">Total Usage Fee</p>
            <p className="text-2xl font-bold text-white">₹{user.totalUsageFee}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-sm text-blue-200 mb-1">Net Balance</p>
            <p className="text-2xl font-bold text-white">₹{user.netBalance}</p>
          </div>
        </div>

        {/* Usage Graph */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Usage Analysis</h3>
          <div className="h-64">
            <ApexCharts options={chartOptions} series={chartSeries} type="area" height="100%" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          {['sessions', 'credits', 'prints'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${activeTab === tab
                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'sessions' && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Session Details</h3>
            <ul className="space-y-4">
              {allSessions.map((session, index) => (
                <li key={index} className="flex items-center justify-between text-sm text-blue-100">
                  <span>
                    {format(new Date(session.startTime), 'MM/dd/yyyy hh:mm a')} -{' '}
                    {session.endTime ? format(new Date(session.endTime), 'hh:mm a') : 'Active'}
                  </span>
                  <span>{(() => {
                    const diff = new Date(session.endTime || Date.now()) - new Date(session.startTime);
                    const minutes = Math.floor(diff / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
                  })()} mins</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {activeTab === 'credits' && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Credit Details</h3>
            <ul className="space-y-4">
              {allCredits.map((credit, index) => (
                <li key={index} className="flex items-center justify-between text-sm text-blue-100">
                  <span>
                    {format(new Date(credit.date), 'MM/dd/yyyy HH:mm')}
                  </span>
                  <span>₹{credit.amount}</span>
                  <span>{credit.notes || '-'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {activeTab === 'prints' && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Print Details</h3>
            <ul className="space-y-4">
              {allPrints.map((print, index) => (
                <li key={index} className="flex items-center justify-between text-sm text-blue-100">
                  <span>
                    {format(new Date(print.date), 'MM/dd/yyyy HH:mm')}
                  </span>
                  <span>{print.pages} pages</span>
                  <span>₹{print.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        )}


      </motion.div>
      {editUser && (

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50"
        >
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-600 p-8 max-w-lg w-full shadow-lg relative">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Edit User</h3>
              <motion.button
                onClick={() => { setEditUser(false), setEditData(""), setError(""), setData(""), setOldPassword(""), setConfirmPassword("") }}
                className="p-2 rounded-lg bg-white/20 border border-white/30 text-white hover:bg-white/30"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Edit User Form */}
            <form onSubmit={handleEditUser} className="space-y-6">
              {editData === "image" ? (
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Profile Image
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors ${uploadLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadLoading || deleteLoading ? (
                          <div className="flex items-center space-x-2">
                            <Loader className="w-8 h-8 mb-2 text-blue-400 animate-spin" />
                            <p className="text-sm text-blue-200">{uploadLoading ? "Uploading..." : "Removing...."}</p>
                          </div>
                        ) : imagePreview ? (
                          <img src={imagePreview} alt="Profile Preview" className="w-24 h-24 object-cover rounded-full mb-2" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-2 text-blue-400" />
                            <p className="text-sm text-blue-200">
                              {imageName || 'Click to upload profile image'}
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={image !== null}
                      />
                    </label>
                  </div>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="mt-2 text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {editData === "Password" ? (
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-1">
                        Old Password
                      </label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="block w-full rounded-lg bg-white/10 border border-gray-500 py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter Password"
                        required
                      />
                      <label className="block mt-6 text-sm font-medium text-blue-200 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="block w-full rounded-lg bg-white/10 border border-gray-500 py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter Password"
                        required
                      />
                      <label className="block mt-2 text-sm font-medium text-blue-200 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-lg bg-white/10 border border-gray-500 py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Enter Password"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-1">
                        {editData === "Class" ? "Class" : editData === "name" ? "User Name" : ""}
                      </label>
                      <input
                        type="text"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="block w-full rounded-lg bg-white/10 border border-gray-500 py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder={editData === "Class" ? "Enter Class" : "Enter User Name"}
                        required
                      />
                    </div>
                  )}
                </>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center space-x-2 text-red-300 bg-red-900/20 p-3 rounded-lg"
                  >
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Submit
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>



      )}
    </motion.div>
  );
}
