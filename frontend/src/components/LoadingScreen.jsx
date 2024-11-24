import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = ({ status, progress, error }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Animated blur circles */}
      <motion.div
        className="absolute w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-30"
        animate={{
          scale: [1, 1.2, 1],
          x: [-50, 50, -50],
          y: [-20, 20, -20],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-30"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [50, -50, 50],
          y: [20, -20, 20],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-96 p-8 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-6">Lab Management</h1>
          
          {/* Loading spinner */}
          <motion.div
            className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Status text */}
          <p className="text-white text-lg mb-4">{status}</p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-200 bg-opacity-20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          {/* Progress percentage */}
          <p className="text-white text-sm mt-2">{progress}%</p>

          {/* Error message if any */}
          {error && (
            <p className="text-red-400 mt-4 text-sm">
              Error: {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;