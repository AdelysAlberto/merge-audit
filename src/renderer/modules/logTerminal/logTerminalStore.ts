import { create } from "zustand";

export interface LogEntryUI {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "AI" | "GITLAB";
  scope: string;
  message: string;
  details?: any;
}

interface LogTerminalState {
  isOpen: boolean;
  logs: LogEntryUI[];
  autoScroll: boolean;
  filterLevel: "ALL" | "INFO" | "WARN" | "ERROR" | "AI" | "GITLAB";
  searchTerm: string;
  toggleTerminal: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setAutoScroll: (autoScroll: boolean) => void;
  setFilterLevel: (level: LogTerminalState["filterLevel"]) => void;
  setSearchTerm: (term: string) => void;
  addLog: (entry: LogEntryUI) => void;
  clearLogs: () => void;
  initListener: () => () => void;
}

export const useLogTerminalStore = create<LogTerminalState>((set, get) => ({
  isOpen: true,
  logs: [],
  autoScroll: true,
  filterLevel: "ALL",
  searchTerm: "",

  toggleTerminal: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (isOpen) => set({ isOpen }),
  setAutoScroll: (autoScroll) => set({ autoScroll }),
  setFilterLevel: (filterLevel) => set({ filterLevel }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),

  addLog: (entry) =>
    set((state) => {
      const nextLogs = [...state.logs, entry];
      if (nextLogs.length > 500) {
        return { logs: nextLogs.slice(-500) };
      }
      return { logs: nextLogs };
    }),

  clearLogs: () => set({ logs: [] }),

  initListener: () => {
    if (window.electronAPI?.onLogEntry) {
      const unsubscribe = window.electronAPI.onLogEntry((entry: any) => {
        get().addLog(entry);
      });
      return unsubscribe;
    }
    return () => {};
  },
}));
