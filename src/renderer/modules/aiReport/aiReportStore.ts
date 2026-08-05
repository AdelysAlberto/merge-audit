import type { AiEvaluationResult } from "@/main/modules/aiProvider/aiTypes.ts";
import { create } from "zustand";

interface AiReportState {
  evaluation: AiEvaluationResult | null;
  isEvaluating: boolean;
  activeView: "report" | "diffs";
  setActiveView: (view: "report" | "diffs") => void;
  evaluateMr: (projectId: string, mrIid: number, titleFallback?: string) => Promise<void>;
  approveMr: (projectId: string, mrIid: number) => Promise<boolean>;
  mergeMr: (projectId: string, mrIid: number) => Promise<boolean>;
}

export const useAiReportStore = create<AiReportState>((set) => ({
  evaluation: null,
  isEvaluating: false,
  activeView: "report",

  setActiveView: (activeView) => set({ activeView }),

  evaluateMr: async (projectId, mrIid, titleFallback) => {
    set({ isEvaluating: true });
    try {
      if (window.electronAPI?.evaluateMr) {
        const res = await window.electronAPI.evaluateMr(projectId, mrIid, titleFallback);
        if (res.ok && res.data) {
          set({ evaluation: res.data, activeView: "report" });
        }
      }
    } finally {
      set({ isEvaluating: false });
    }
  },

  approveMr: async (projectId, mrIid) => {
    if (window.electronAPI?.approveMr) {
      const res = await window.electronAPI.approveMr(projectId, mrIid);
      return res.ok;
    }
    return false;
  },

  mergeMr: async (projectId, mrIid) => {
    if (window.electronAPI?.mergeMr) {
      const res = await window.electronAPI.mergeMr(projectId, mrIid);
      return res.ok;
    }
    return false;
  },
}));
