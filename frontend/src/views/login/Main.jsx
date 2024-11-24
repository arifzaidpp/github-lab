import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLabStore } from '../../store/lab';
import { KeyRound, UserRound, AlertCircle, Monitor, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  const [purposes, setPurposes] = useState([]);
  const [purpose, setPurpose] = useState('Internet');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [online, setOnline] = useState(true);
  const labId = useLabStore((state) => state.labId);
    
  const API_BASE_URL =  import.meta.env.VITE_API_BASE_URL  || '/api' ;

  const fetchPurposes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/purposes`, { method: 'GET' });
      const data = await response.json();
      setPurposes(data);
    } catch (error) {
      console.error('Failed to fetch purposes:', error);
    }
  };

  useEffect(() => {
    fetchPurposes();
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);


  const handlePurposeChange = (e) => {
    const selectedPurpose = e.target.value;
    setPurpose(selectedPurpose);

    // Set `online` to false if the selected purpose is "Offline"
    if (online && selectedPurpose === 'Offline') {
      setOnline(false);
    }else if (!online && selectedPurpose === 'Internet') {
      setOnline(true);
    }
  };

  const handleToggle = () => {
    const newOnlineStatus = !online;
    setOnline(newOnlineStatus);

    if (newOnlineStatus && purpose === 'Offline') {
      setPurpose('Internet');
    } else if (!newOnlineStatus && purpose === 'Internet') {
      setPurpose('Offline');
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); // Clear previous errors
    
    try {
      // Time and Day Validation for "Class"
      if (purpose === 'Class') {
        const now = new Date();
        const currentDay = now.getDay(); // Sunday = 0, Monday = 1, ..., Friday = 5, Saturday = 6
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Time in minutes from midnight
        const startTime = 7 * 60 + 45; // 7:45 AM in minutes
        const endTime = 16 * 60 + 15; // 4:15 PM in minutes
  
        // Check if it's Friday or if the current time is outside allowed hours
        if (currentDay === 5 || currentTime < startTime || currentTime > endTime) {
          setError('No class allowed at this time');
          setIsLoading(false);
          return;
        }
      }

      if (admissionNumber === "admin" && purpose !== "Internet") {
        setError('Only Internet is allowed for admin');
        setIsLoading(false);
        return;
      }
  
      if (labId) {
        await login(admissionNumber, password, purpose, labId, online);
      } else {
        setError('Lab ID is missing');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPurposes = purposes
    .sort((a, b) => {
      if (a.name === 'Internet') return -1;
      if (b.name === 'Internet') return 1;
      if (a.name === 'Offline') return -1;
      if (b.name === 'Offline') return 1;
      return 0;
    });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -inset-[10px] opacity-50"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-3xl"></div>
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/20 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/20 blur-3xl"></div>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl p-8 space-y-6 border border-white/20 relative z-10"
      >
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex justify-center mb-6"
          >
            <Monitor className="h-12 w-12 text-blue-400" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">Lab Management</h1>
          <p className="text-blue-200">Sign in to your account</p>
          <div className="text-sm text-blue-300 mt-2">
            Lab ID: {labId}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <motion.div
              className="relative group"
              whileTap={{ scale: 0.995 }}
            >
              <UserRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5 transition-colors group-focus-within:text-blue-400" />
              <input
                type="text"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                className="pl-10 block w-full rounded-lg bg-white/5 border border-white/10 py-3 px-4 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your admission number"
                required
              />
            </motion.div>

            <motion.div
              className="relative group"
              whileTap={{ scale: 0.995 }}
            >
              <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 h-5 w-5 transition-colors group-focus-within:text-blue-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 block w-full rounded-lg bg-white/5 border border-white/10 py-3 px-4 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
                required
              />
            </motion.div>

            <motion.div
              className="relative flex flex-col space-y-2"
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center justify-between">
                <label className="block text-white">Purpose :</label>
                <RefreshCcw
                  onClick={fetchPurposes}
                  size={20}
                  className="text-blue-300 cursor-pointer hover:text-blue-400 transition-colors"
                />
              </div>
              <select
                value={purpose}
                onChange={handlePurposeChange}
                className="block w-full rounded-lg bg-white/5 border border-white/10 py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none"
              >
                {filteredPurposes.map(p => (
                  <option key={p._id} value={p.name} className="bg-gray-900 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </motion.div>


            <motion.div
              className="relative flex items-center space-x-2"
              whileTap={{ scale: 0.995 }}
            >
              <input
                type="checkbox"
                id="toggle"
                className="sr-only"
                checked={online}
                onChange={handleToggle}
              />
              <div
                onClick={handleToggle}
                className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 relative cursor-pointer ${online ? 'bg-green-600' : 'bg-[#41496c] dark:bg-gray-700'}`}
              >
                <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${online ? 'translate-x-full' : ''}`}></div>
              </div>
              <label className={` ${online ? 'text-green-500' : 'text-gray-300'}`}>
                {online ? 'Online' : 'Offline'}
              </label>
            </motion.div>
          </div>

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

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-900 transition-all duration-200 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <div className="text-center text-blue-200 text-sm">
          <p>Contact administrator if you need access</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
