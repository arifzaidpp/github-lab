import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import Select from 'react-select';

export default function PrintManagement({
  prints,
  users,
  onAddPrint,
  showAddForm,
  onDelete,
  setShowAddForm,
  onRefresh
}) {
  const [selectedUser, setSelectedUser] = useState('');
  const [page, setPage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageByUser, setPageByUser] = useState(false);

  const handleToggle = () => {
    setPageByUser(!pageByUser);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !page) {
      setError('Please fill in all required fields');
      return;
    }


    setIsSubmitting(true);
    try {
      await onAddPrint({
        userId: selectedUser.value,
        page: Number(page),
        pageByUser,
      });
      setShowAddForm(false);
      setSelectedUser('');
      setPage('');
      setError('');
      onRefresh();
    } catch (error) {
      setError('Failed to add print');
    } finally {
      setIsSubmitting(false);
    }
  };

  

  // Map users to options for react-select
  const userOptions = users.map(user => ({
    value: user._id,
    label: `${user.name} (${user.admissionNumber})`
  }));

  return (
    <div>
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                User
              </label>
              <Select
                value={selectedUser}
                onChange={setSelectedUser}
                options={userOptions}
                placeholder="Select a user"
                className="text-black"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    paddingTop: '2.5px',
                    paddingBottom: '2.5px',
                    boxShadow: 'none', // Remove shadow from the control
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    outline: 'none', // Remove any outline
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: '#273259', // Dark menu background
                    borderRadius: '8px',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.5)',
                    marginTop: '2px',
                    paddingTop: '5px',
                    paddingBottom: '5px',
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? '#3E3E5E' // Darker for selected item
                      : state.isFocused
                        ? '#1959c0' // Hover effect for focus
                        : '#273259', // Default option background
                    color: 'white', // White text color for options
                    cursor: 'pointer',
                    width: 'calc(100% - 30px)',
                    marginLeft: '15px',
                    marginRight: '15px',
                    borderRadius: '4px',
                    padding: '10px 15px',
                    '&:hover': {
                      backgroundColor: '#1959c0',
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: 'white', // White color for the selected option
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: 'rgba(255, 255, 255, 0.7)', // Lighter white for placeholder text
                  }),
                  input: (base) => ({
                    ...base,
                    color: 'white', // White color for user input text
                    boxShadow: 'none !important', // Remove any shadow
                    border: 'none !important', // Ensure no border around the input
                    outline: 'none !important', // Remove any outline on focus
                    caretColor: 'white', // Set the caret color to white
                    backgroundColor: 'transparent', // Transparent background for input
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    color: 'white', // Set the dropdown indicator (arrow) to white
                  }),
                  indicatorSeparator: () => ({
                    display: 'none', // Hide the indicator separator (small line)
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    color: 'white', // Set the clear indicator to white
                  }),
                }}
                isClearable
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Page(s)
              </label>
              <input
                type="number"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                A4 By User
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="toggle"
                  className="sr-only"
                  checked={pageByUser}
                  onChange={handleToggle}
                />
                <div
                  onClick={handleToggle}
                  className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 relative cursor-pointer ${pageByUser ? 'bg-green-600' : 'bg-[#41496c] dark:bg-gray-700'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${pageByUser ? 'translate-x-full' : ''}`}></div>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex space-x-2">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-blue-600/20 border border-blue-500/30 text-blue-100 py-2 rounded-lg hover:bg-blue-600/30"
              >
                {isSubmitting ? 'Adding...' : 'Add Print'}
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-white/5 border border-white/10 text-gray-300 py-2 rounded-lg hover:bg-white/10"
              >
                Cancel
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>


      
        <div className="bg-white/5 backdrop-blur-lg border mt-2 border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="bg-black/20">
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Page(s)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {prints.length > 0 ? (
                  prints.map((print) => (
                    <tr key={print._id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {format(new Date(print.date), 'PPp')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {print ? `${print.userId.name} (${print.userId.admissionNumber})` : 'Unknown User'}
                      </td>
              
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {print.pages || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <span className="inline-flex items-center text-green-400">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          {print.amount || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onDelete(print._id)}
                          className="bg-red-600/20 text-red-500 px-2 py-1 rounded-lg hover:bg-red-600/30"
                        >
                          Delete
                        </motion.button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-green-100 p-4 text-center">No prints found !</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
