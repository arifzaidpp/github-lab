import React, { useState, useEffect } from 'react';
import { Clock, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { FaCheckSquare, FaRegSquare } from 'react-icons/fa';

export default function SessionsList({ sessions, onRemoveFee, onCutFee, onEndSession }) {
  const [selectedSessions, setSelectedSessions] = useState([]);

  useEffect(() => {
    setSelectedSessions([]);
  }, [sessions]);

  const handleSelectSession = (sessionId) => {
    setSelectedSessions((prevSelected) =>
      prevSelected.includes(sessionId)
        ? prevSelected.filter((id) => id !== sessionId)
        : [...prevSelected, sessionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSessions.length === sessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(sessions.map((session) => session._id));
    }
  };

  const hasActiveSessions = sessions.some((session) => session.endTime === null);

  return (
    <>
      {selectedSessions.length > 0 && (
        <div className="flex justify-start mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onRemoveFee(selectedSessions)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white border border-red-500 rounded-lg hover:bg-red-700 transition-colors duration-200 ml-2"
          >
            Remove Fee
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCutFee(selectedSessions)}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white border border-yellow-500 rounded-lg hover:bg-yellow-700 transition-colors duration-200 ml-2"
          >
            Cut 50%
          </motion.button>
        </div>
      )}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead>
              <tr className="bg-black/20">
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                  <div onClick={handleSelectAll} className="cursor-pointer flex items-center">
                    {selectedSessions.length === sessions.length ? (
                      <FaCheckSquare className="text-green-400 mr-2" />
                    ) : (
                      <FaRegSquare className="text-gray-400 mr-2" />
                    )}
                    <p>All</p>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                  Admission Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                  Lab
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                  Usage Fee
                </th>
                {hasActiveSessions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div onClick={() => handleSelectSession(session._id)} className="cursor-pointer flex items-center">
                        {selectedSessions.includes(session._id) ? (
                          <FaCheckSquare className="text-green-400 mr-2" />
                        ) : (
                          <FaRegSquare className="text-gray-400 mr-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {session.admissionNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {format(new Date(session.startTime), 'PPp')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {session.endTime ? format(new Date(session.endTime), 'PPp') : 'Active'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="inline-flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-blue-400" />
                        {(() => {
                          const diff = new Date(session.endTime || Date.now()) - new Date(session.startTime);
                          const minutes = Math.floor(diff / 60000);
                          const seconds = Math.floor((diff % 60000) / 1000);
                          return `${minutes}:${seconds.toString().padStart(2, "0")}`;
                        })()} mins
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="inline-flex items-center">
                        {session.purpose}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="inline-flex items-center">
                        {session.labId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="inline-flex items-center">
                        <IndianRupee className="h-4 w-4 mr-1 text-green-400" />
                        {session.usageFee}
                      </span>
                    </td>
                    {hasActiveSessions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {session.endTime === null && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onEndSession(session)}
                            className="bg-red-600/20 text-red-500 px-2 py-1 rounded-lg hover:bg-red-600/30"
                          >
                            End Session
                          </motion.button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hasActiveSessions ? "8" : "7"} className="text-green-100 p-4 text-center">
                    <div className="flex justify-center items-center h-full">
                      No sessions found for the current search and filter criteria.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
