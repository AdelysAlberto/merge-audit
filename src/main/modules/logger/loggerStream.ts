import { BrowserWindow } from "electron";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "AI" | "GITLAB";
  scope: string;
  message: string;
  details?: any;
}

let logHistory: LogEntry[] = [];

export const logToTerminal = (
  level: LogEntry["level"],
  scope: string,
  message: string,
  details?: any,
): LogEntry => {
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toLocaleTimeString("es-ES", { hour12: false }),
    level,
    scope,
    message,
    details,
  };

  logHistory.push(entry);
  if (logHistory.length > 500) {
    logHistory = logHistory.slice(-500);
  }

  // Broadcast to all open windows
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send("logger:log", entry);
    }
  }

  return entry;
};

export const getLogHistory = (): LogEntry[] => {
  return [...logHistory];
};

export const clearLogHistory = (): void => {
  logHistory = [];
};
