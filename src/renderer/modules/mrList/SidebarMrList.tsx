import type React from "react";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { t } from "../../shared/i18n/useI18n";
import { getActiveProjectId, useSettingsStore } from "../settings/settingsStore";
import styles from "./SidebarMrList.module.css";
import { useMrListStore } from "./mrListStore";

export const SidebarMrList: React.FC = () => {
  const { mrs, selectedMrIid, searchQuery, isLoadingMrs, fetchMrs, fetchMrDetails } =
    useMrListStore(
      useShallow((state) => ({
        mrs: state.mrs,
        selectedMrIid: state.selectedMrIid,
        searchQuery: state.searchQuery,
        isLoadingMrs: state.isLoadingMrs,
        fetchMrs: state.fetchMrs,
        fetchMrDetails: state.fetchMrDetails,
      })),
    );

  const activeProjectId = useSettingsStore((state) => getActiveProjectId(state.config));

  useEffect(() => {
    fetchMrs(activeProjectId);
  }, [activeProjectId, fetchMrs]);

  const filteredMrs = mrs.filter((mr) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return mr.title.toLowerCase().includes(q) || mr.author.name.toLowerCase().includes(q);
  });

  const handleSelectMr = (mrIid: number, title: string) => {
    fetchMrDetails(activeProjectId, mrIid, title);
  };

  return (
    <aside className={styles.sidebarContainer}>
      <div className={styles.sidebarHeader}>
        <span className={styles.sidebarTitle}>{t("mrList.openMrs")}</span>
        <span className={styles.countBadge}>{filteredMrs.length}</span>
      </div>

      <div className={styles.mrList}>
        {isLoadingMrs ? (
          <div className={styles.emptyState}>Cargando Merge Requests...</div>
        ) : filteredMrs.length === 0 ? (
          <div className={styles.emptyState}>{t("mrList.noMrs")}</div>
        ) : (
          filteredMrs.map((mr) => {
            const isSelected = selectedMrIid === mr.iid;
            const status = (mr.pipelineStatus || "none").toLowerCase();
            let pipelineLabel = "SIN PIPELINE";
            let pipelineClass = styles.pipelineNone;

            if (status === "success" || status === "passed") {
              pipelineLabel = "PASSED";
              pipelineClass = styles.pipelineSuccess;
            } else if (status === "failed") {
              pipelineLabel = "FAILED";
              pipelineClass = styles.pipelineFailed;
            } else if (status === "running" || status === "pending") {
              pipelineLabel = status.toUpperCase();
              pipelineClass = styles.pipelineRunning;
            } else if (status !== "none") {
              pipelineLabel = status.toUpperCase();
              pipelineClass = styles.pipelineNone;
            }

            return (
              <div
                key={mr.id}
                className={`${styles.mrCard} ${isSelected ? styles.mrCardActive : ""}`}
                onClick={() => handleSelectMr(mr.iid, mr.title)}
              >
                <div className={styles.cardTopRow}>
                  <span className={styles.mrIid}>!{mr.iid}</span>
                  <div className={styles.badgesGroup}>
                    <span className={`${styles.pipelineBadge} ${pipelineClass}`}>
                      {pipelineLabel}
                    </span>
                  </div>
                </div>

                <div className={styles.mrTitle}>{mr.title}</div>

                <div className={styles.cardBottomRow}>
                  <div className={styles.author}>
                    <span>👤</span>
                    <span>{mr.author.name}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
