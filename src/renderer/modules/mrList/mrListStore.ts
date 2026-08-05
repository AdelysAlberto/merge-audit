import type { GitLabMergeRequest, GitLabMrDetails } from "@/main/modules/gitlab/gitlabTypes.ts";
import { create } from "zustand";

interface MrListState {
  mrs: GitLabMergeRequest[];
  selectedMrIid: number | null;
  selectedMrDetails: GitLabMrDetails | null;
  searchQuery: string;
  isLoadingMrs: boolean;
  isLoadingDetails: boolean;
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedMrIid: (iid: number | null) => void;
  fetchMrs: (projectId: string) => Promise<void>;
  fetchMrDetails: (projectId: string, mrIid: number, titleFallback?: string) => Promise<void>;
}

export const useMrListStore = create<MrListState>((set, get) => ({
  mrs: [],
  selectedMrIid: null,
  selectedMrDetails: null,
  searchQuery: "",
  isLoadingMrs: false,
  isLoadingDetails: false,
  activeProjectId: "259257",

  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedMrIid: (selectedMrIid) => set({ selectedMrIid }),

  fetchMrs: async (projectId) => {
    set({ isLoadingMrs: true, activeProjectId: projectId });
    try {
      if (window.electronAPI?.fetchMrs) {
        const res = await window.electronAPI.fetchMrs(projectId);
        if (res.ok && res.data) {
          set({ mrs: res.data });
          // Auto-select first MR if none selected
          if (res.data.length > 0 && !get().selectedMrIid) {
            get().setSelectedMrIid(res.data[0].iid);
            await get().fetchMrDetails(projectId, res.data[0].iid, res.data[0].title);
          }
        }
      }
    } finally {
      set({ isLoadingMrs: false });
    }
  },

  fetchMrDetails: async (projectId, mrIid, titleFallback) => {
    set({ isLoadingDetails: true, selectedMrIid: mrIid });
    try {
      if (window.electronAPI?.fetchMrDetails) {
        const res = await window.electronAPI.fetchMrDetails(projectId, mrIid, titleFallback);
        if (res.ok && res.data) {
          set({ selectedMrDetails: res.data });
        }
      }
    } finally {
      set({ isLoadingDetails: false });
    }
  },
}));
