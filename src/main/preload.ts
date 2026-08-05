import { contextBridge, ipcRenderer } from "electron";

const electronAPI = {
  // Config
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (newConfig: any) => ipcRenderer.invoke("config:save", newConfig),

  // Rules (.md)
  listRules: () => ipcRenderer.invoke("rules:list"),
  addRule: (filePath?: string) => ipcRenderer.invoke("rules:add", filePath),
  deleteRule: (filename: string) => ipcRenderer.invoke("rules:delete", filename),

  // GitLab
  fetchMrs: (projectId: string) => ipcRenderer.invoke("gitlab:fetchMrs", projectId),
  fetchMrDetails: (projectId: string, mrIid: number, titleFallback?: string) =>
    ipcRenderer.invoke("gitlab:fetchMrDetails", projectId, mrIid, titleFallback),
  approveMr: (projectId: string, mrIid: number) =>
    ipcRenderer.invoke("gitlab:approveMr", projectId, mrIid),
  mergeMr: (projectId: string, mrIid: number) =>
    ipcRenderer.invoke("gitlab:mergeMr", projectId, mrIid),

  // AI Evaluation
  evaluateMr: (projectId: string, mrIid: number, titleFallback?: string) =>
    ipcRenderer.invoke("ai:evaluateMr", projectId, mrIid, titleFallback),

  // Logs Stream
  onLogEntry: (callback: (entry: any) => void) => {
    const listener = (_event: any, entry: any) => callback(entry);
    ipcRenderer.on("logger:log", listener);
    return () => ipcRenderer.removeListener("logger:log", listener);
  },
  getLogHistory: () => ipcRenderer.invoke("logger:getHistory"),
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);
