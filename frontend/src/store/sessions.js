import { create } from 'zustand';

export const useSessionStore = create((set) => ({
    sessions: [],
    allSessions: [],
    activeSession: null,
    startSession: (session) => set({ activeSession: session }),
    endSession: () => set({ activeSession: null }),
    setSessions: (sessions) => set({ sessions }),
    updateLastActivity: () => set((state) => ({
        activeSession: state.activeSession
            ? { ...state.activeSession, lastActivityTime: new Date().toISOString() }
            : null
    })),
}));
