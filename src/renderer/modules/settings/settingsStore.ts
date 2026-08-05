import { type AppConfig, defaultConfig } from "@/main/modules/config/configTypes.ts";
import { create } from "zustand";

export interface RuleFileUI {
  name: string;
  path: string;
  sizeBytes: number;
  updatedAt: string;
}

interface SettingsState {
  isModalOpen: boolean;
  activeTab: "gitlab" | "ai" | "rules";
  config: AppConfig;
  rules: RuleFileUI[];
  isLoading: boolean;
  openModal: () => void;
  closeModal: () => void;
  setActiveTab: (tab: "gitlab" | "ai" | "rules") => void;
  setConfig: (config: AppConfig) => void;
  updateGitLabConfig: (patch: Partial<AppConfig["gitlab"]>) => void;
  updateAiConfig: (patch: Partial<AppConfig["ai"]>) => void;
  loadConfigFromMain: () => Promise<void>;
  saveConfigToMain: () => Promise<void>;
  loadRulesFromMain: () => Promise<void>;
  addRuleFile: (filePath?: string) => Promise<void>;
  deleteRuleFile: (filename: string) => Promise<void>;
}

export const getActiveProjectId = (config: AppConfig): string => {
  const active = config.gitlab.activeProjectId;
  const projects = config.gitlab.projects || [];
  if (active && projects.some((p) => p.id === active)) {
    return active;
  }
  return projects[0]?.id || "";
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  isModalOpen: false,
  activeTab: "gitlab",
  config: defaultConfig,
  rules: [],
  isLoading: false,

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  setConfig: (config) => set({ config }),
  updateGitLabConfig: (patch) =>
    set((state) => ({
      config: {
        ...state.config,
        gitlab: { ...state.config.gitlab, ...patch },
      },
    })),
  updateAiConfig: (patch) =>
    set((state) => ({
      config: {
        ...state.config,
        ai: { ...state.config.ai, ...patch },
      },
    })),

  loadConfigFromMain: async () => {
    set({ isLoading: true });
    try {
      if (window.electronAPI?.getConfig) {
        const res = await window.electronAPI.getConfig();
        if (res.ok && res.data) {
          const validActiveId = getActiveProjectId(res.data);
          const sanitizedConfig = {
            ...res.data,
            gitlab: {
              ...res.data.gitlab,
              activeProjectId: validActiveId,
            },
          };
          set({ config: sanitizedConfig });
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },

  saveConfigToMain: async () => {
    const config = get().config;
    if (window.electronAPI?.saveConfig) {
      await window.electronAPI.saveConfig(config);
    }
  },

  loadRulesFromMain: async () => {
    if (window.electronAPI?.listRules) {
      const res = await window.electronAPI.listRules();
      if (res.ok && res.data) {
        set({ rules: res.data });
      }
    }
  },

  addRuleFile: async (filePath) => {
    if (window.electronAPI?.addRule) {
      const res = await window.electronAPI.addRule(filePath);
      if (res.ok) {
        await get().loadRulesFromMain();
      }
    }
  },

  deleteRuleFile: async (filename) => {
    if (window.electronAPI?.deleteRule) {
      const res = await window.electronAPI.deleteRule(filename);
      if (res.ok) {
        await get().loadRulesFromMain();
      }
    }
  },
}));
