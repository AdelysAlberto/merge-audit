import type React from "react";
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { t } from "../../shared/i18n/useI18n";
import styles from "./LogTerminal.module.css";
import { useLogTerminalStore } from "./logTerminalStore";

export const LogTerminal: React.FC = () => {
  const {
    isOpen,
    logs,
    autoScroll,
    filterLevel,
    toggleTerminal,
    setAutoScroll,
    setFilterLevel,
    clearLogs,
    initListener,
  } = useLogTerminalStore(
    useShallow((state) => ({
      isOpen: state.isOpen,
      logs: state.logs,
      autoScroll: state.autoScroll,
      filterLevel: state.filterLevel,
      toggleTerminal: state.toggleTerminal,
      setAutoScroll: state.setAutoScroll,
      setFilterLevel: state.setFilterLevel,
      clearLogs: state.clearLogs,
      initListener: state.initListener,
    })),
  );

  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = initListener();
    return () => unsub();
  }, [initListener]);

  useEffect(() => {
    if (autoScroll && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((l) => {
    if (filterLevel === "ALL") return true;
    return l.level === filterLevel;
  });

  return (
    <div className={`${styles.terminalDrawer} ${!isOpen ? styles.terminalClosed : ""}`}>
      <div className={styles.terminalHeader}>
        <div className={styles.titleArea} onClick={toggleTerminal}>
          <span style={{ fontSize: "0.8rem" }}>{isOpen ? "▼" : "▲"}</span>
          <span className={styles.termTitle}>🖥️ {t("terminal.title")}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            ({filteredLogs.length} eventos)
          </span>
        </div>

        <div className={styles.controlsArea}>
          <select
            className={styles.levelSelect}
            value={filterLevel}
            onChange={(e: any) => setFilterLevel(e.target.value)}
          >
            <option value="ALL">TODOS</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="AI">AI</option>
            <option value="GITLAB">GITLAB</option>
          </select>

          <button
            type="button"
            className={styles.termBtn}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            AutoScroll: {autoScroll ? "ON" : "OFF"}
          </button>

          <button type="button" className={styles.termBtn} onClick={clearLogs}>
            {t("terminal.clear")}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className={styles.logBody} ref={bodyRef}>
          {filteredLogs.map((log) => {
            const levelClass =
              log.level === "INFO"
                ? styles.lvlINFO
                : log.level === "WARN"
                  ? styles.lvlWARN
                  : log.level === "ERROR"
                    ? styles.lvlERROR
                    : log.level === "AI"
                      ? styles.lvlAI
                      : styles.lvlGITLAB;

            return (
              <div key={log.id} className={styles.logLine}>
                <span className={styles.logTime}>[{log.timestamp}]</span>
                <span className={`${styles.levelBadge} ${levelClass}`}>[{log.level}]</span>
                <span className={styles.logScope}>[{log.scope}]</span>
                <span className={styles.logMsg}>{log.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
