import type React from "react";
import { useShallow } from "zustand/react/shallow";
import { t } from "../../shared/i18n/useI18n";
import { useMrListStore } from "../mrList/mrListStore";
import { getActiveProjectId, useSettingsStore } from "../settings/settingsStore";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  const openSettingsModal = useSettingsStore((state) => state.openModal);

  const { configProjects, activeProjectId } = useSettingsStore(
    useShallow((state) => ({
      configProjects: state.config.gitlab.projects,
      activeProjectId: getActiveProjectId(state.config),
    })),
  );

  const { fetchMrs, setSearchQuery } = useMrListStore(
    useShallow((state) => ({
      fetchMrs: state.fetchMrs,
      setSearchQuery: state.setSearchQuery,
    })),
  );

  const updateGitLabConfig = useSettingsStore((state) => state.updateGitLabConfig);
  const saveConfigToMain = useSettingsStore((state) => state.saveConfigToMain);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value;
    updateGitLabConfig({ activeProjectId: newProjectId });
    saveConfigToMain();
    fetchMrs(newProjectId);
  };

  return (
    <header className={styles.headerContainer}>
      <div className={styles.brand}>
        <span className={styles.logoBadge}>{t("app.title")}</span>
        <span className={styles.brandTitle}>{t("app.subtitle")}</span>
      </div>

      <div className={styles.controlsGroup}>
        <select
          className={styles.projectSelect}
          value={activeProjectId}
          onChange={handleProjectChange}
        >
          {configProjects.map((p: { id: string; name: string }) => (
            <option key={p.id} value={p.id}>
              #{p.id} - {p.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          className={styles.searchInput}
          placeholder={t("header.searchPlaceholder")}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => fetchMrs(activeProjectId)}
        >
          🔄 {t("header.refresh")}
        </button>

        <button
          type="button"
          className={`${styles.actionBtn} ${styles.settingsBtn}`}
          onClick={openSettingsModal}
        >
          ⚙️ {t("header.settings")}
        </button>
      </div>
    </header>
  );
};
