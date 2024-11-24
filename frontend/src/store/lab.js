import { create } from 'zustand';

// Safe Electron require
const getElectronBridge = () => {
    try {
        if (window && 'electron' in window) {
            return window.electron;
        }
        return null;
    } catch {
        return null;
    }
};

export const useLabStore = create((set) => ({
    computerId: null,
    labId: null,
    isLabSet: false,
    setLabId: async (id) => {
        const electron = getElectronBridge();
        if (electron) {
            await electron.invoke('set-lab-id', id);
        }
        set({ labId: id, isLabSet: true });
    },
    initializeLab: async () => {
        const electron = getElectronBridge();
        let labId = null;
        let computerId = null; // Declare computerId here
        
        if (electron) {
            labId = await electron.invoke('get-lab-id');
            computerId = await electron.invoke('get-computer-id');
            
        } else {
            // Fallback for development/web environment
            labId = localStorage.getItem('labId') || 'DEV-LAB';
            computerId = 'DEV-COMPUTER'; // Assign a default computerId for development
            localStorage.setItem('labId', labId);
        }
        
        set({ labId, computerId, isLabSet: true }); // Set computerId in the store
    },
}));
