import React, { useState, useEffect, useRef } from 'react';
import { Clock, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth';

export default function FloatingTimer({ session, onLogout }) {
  const user = useAuthStore((state) => state.user);
  const timerRef = useRef(null);
  const [duration, setDuration] = useState('0:00');

  useEffect(() => {
    const updateDuration = () => {
      const start = new Date(session.startTime).getTime();
      const now = new Date().getTime();
      const diff = now - start;
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      if (minutes >= 60) {
      onLogout();
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [session.startTime, onLogout]);

  return (
    <motion.div
      ref={timerRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 200,
        height: 'auto',
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-gray-800/90 backdrop-blur-lg draggable border border-gray-700 p-3 z-40 select-none shadow-lg"
    >
      <div className="flex flex-col items-center space-y-3 w-full">
        <div className="text-white text-sm">
          <span className="opacity-70">Logged in as : </span> <br />
          <span className="font-medium">{user?.name}</span>
        </div>
        <motion.div 
          className="flex items-center space-x-2 text-white"
          animate={{
            scale: duration <= 5 ? [1, 1.1, 1] : 1,
            color: duration <= 5 ? ['#fff', '#ef4444', '#fff'] : '#fff'
          }}
          transition={{
            duration: 1,
            repeat: duration <= 5 ? Infinity : 0,
            repeatType: "reverse"
          }}
        >
          <Clock className="h-5 w-5 text-blue-400" />
          <span className="font-semibold text-sm">{duration} minutes </span>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLogout}
          className="w-full flex items-center no-drag justify-center space-x-2 px-3 py-2 bg-red-600/20 border border-red-500/30 rounded-md text-red-100 hover:bg-red-600/30 transition-colors duration-200 text-sm"
        >
          <Square className="h-5 w-5" />
          <span>End Session</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
