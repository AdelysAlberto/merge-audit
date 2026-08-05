import type React from "react";
import { useEffect } from "react";
import styles from "./App.module.css";
import { AiReportPanel } from "./modules/aiReport/AiReportPanel";
import { Header } from "./modules/header/Header";
import { LogTerminal } from "./modules/logTerminal/LogTerminal";
import { SidebarMrList } from "./modules/mrList/SidebarMrList";
import { useMrListStore } from "./modules/mrList/mrListStore";
import { SettingsModal } from "./modules/settings/SettingsModal";
import { getActiveProjectId, useSettingsStore } from "./modules/settings/settingsStore";

export const App: React.FC = () => {
  const loadConfigFromMain = useSettingsStore((state) => state.loadConfigFromMain);

  useEffect(() => {
    loadConfigFromMain().then(() => {
      const config = useSettingsStore.getState().config;
      const activeId = getActiveProjectId(config);
      if (activeId) {
        useMrListStore.getState().fetchMrs(activeId);
      }
    });
  }, [loadConfigFromMain]);

  return (
    <div className={styles.appLayout}>
      <Header />
      <div className={styles.mainBody}>
        <SidebarMrList />
        <AiReportPanel />
      </div>
      <LogTerminal />
      <SettingsModal />
    </div>
  );
};
