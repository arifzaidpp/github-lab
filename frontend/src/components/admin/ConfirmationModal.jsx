import React from 'react';
import { motion } from 'framer-motion';

export default function ConfirmationModal({ isOpen, data, onCancel }) {
    if (!isOpen) return null;

    console.log(data);
    console.log(onCancel);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">{data?.title}</h2>
                    <p className="mb-6 text-gray-700">{data.message}</p>
                    <div className="flex justify-between">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 transition"
                        >
                            {data.cancelLabel ? data.cancelLabel : "Cancel"}
                        </button>
                        <button
                            onClick={data.onConfirm}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                        >
                            {data.buttonLabel}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
