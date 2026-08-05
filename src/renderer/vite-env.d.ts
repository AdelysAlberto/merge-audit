/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    getConfig: () => Promise<any>;
    saveConfig: (newConfig: any) => Promise<any>;
    listRules: () => Promise<any>;
    addRule: (filePath?: string) => Promise<any>;
    deleteRule: (filename: string) => Promise<any>;
    fetchMrs: (projectId: string) => Promise<any>;
    fetchMrDetails: (projectId: string, mrIid: number, titleFallback?: string) => Promise<any>;
    approveMr: (projectId: string, mrIid: number) => Promise<any>;
    mergeMr: (projectId: string, mrIid: number) => Promise<any>;
    evaluateMr: (projectId: string, mrIid: number, titleFallback?: string) => Promise<any>;
    onLogEntry: (callback: (entry: any) => void) => () => void;
    getLogHistory: () => Promise<any>;
  };
}
