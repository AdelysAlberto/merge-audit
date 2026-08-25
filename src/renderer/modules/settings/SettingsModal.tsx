import type React from "react";
import {useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {t} from "../../shared/i18n/useI18n";
import {useMrListStore} from "../mrList/mrListStore";
import styles from "./SettingsModal.module.css";
import {getActiveProjectId, useSettingsStore} from "./settingsStore";

export const SettingsModal: React.FC = () => {
  const {
    isOpen,
    activeTab,
    config,
    rules,
    closeModal,
    setActiveTab,
    updateGitLabConfig,
    updateAiConfig,
    saveConfigToMain,
    loadRulesFromMain,
    addRuleFile,
    deleteRuleFile,
  } = useSettingsStore(
    useShallow((state) => ({
      isOpen: state.isModalOpen,
      activeTab: state.activeTab,
      config: state.config,
      rules: state.rules,
      closeModal: state.closeModal,
      setActiveTab: state.setActiveTab,
      updateGitLabConfig: state.updateGitLabConfig,
      updateAiConfig: state.updateAiConfig,
      saveConfigToMain: state.saveConfigToMain,
      loadRulesFromMain: state.loadRulesFromMain,
      addRuleFile: state.addRuleFile,
      deleteRuleFile: state.deleteRuleFile,
    })),
  );

  const [newProjId, setNewProjId] = useState("");
  const [newProjName, setNewProjName] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadRulesFromMain();
    }
  }, [isOpen, loadRulesFromMain]);

  if (!isOpen) return null;

  const handleAddProject = () => {
    if (!newProjId.trim() || !newProjName.trim()) return;
    const addedId = newProjId.trim();
    const updatedProjects = [...config.gitlab.projects, {id: addedId, name: newProjName.trim()}];
    updateGitLabConfig({projects: updatedProjects, activeProjectId: addedId});
    setNewProjId("");
    setNewProjName("");
  };

  const handleRemoveProject = (id: string) => {
    const updatedProjects = config.gitlab.projects.filter(
      (p: {id: string; name: string}) => p.id !== id,
    );
    const nextActiveId =
      config.gitlab.activeProjectId === id
        ? updatedProjects[0]?.id || ""
        : config.gitlab.activeProjectId;
    updateGitLabConfig({projects: updatedProjects, activeProjectId: nextActiveId});
  };

  const handleSave = async () => {
    const currentConfig = useSettingsStore.getState().config;
    const validActiveId = getActiveProjectId(currentConfig);
    if (currentConfig.gitlab.activeProjectId !== validActiveId) {
      updateGitLabConfig({activeProjectId: validActiveId});
    }
    await saveConfigToMain();
    if (validActiveId) {
      useMrListStore.getState().fetchMrs(validActiveId);
    }
    closeModal();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>⚙️ {t("settingsModal.title")}</h2>
          <button type="button" className={styles.closeBtn} onClick={closeModal}>
            ✕
          </button>
        </div>

        <div className={styles.tabsBar}>
          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === "gitlab" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("gitlab")}
          >
            🦊 {t("settingsModal.tabGitLab")}
          </button>
          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === "ai" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            🤖 {t("settingsModal.tabAi")}
          </button>
          <button
            type="button"
            className={`${styles.tabItem} ${activeTab === "rules" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("rules")}
          >
            📄 {t("settingsModal.tabRules")}
          </button>
        </div>

        <div className={styles.modalBody}>
          {activeTab === "gitlab" && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t("settingsModal.gitlabHost")}</label>
                <input
                  type="text"
                  className={styles.input}
                  value={config.gitlab.hostUrl}
                  onChange={(e) => updateGitLabConfig({hostUrl: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t("settingsModal.gitlabToken")}</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                  value={config.gitlab.token}
                  onChange={(e) => updateGitLabConfig({token: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t("settingsModal.gitlabProjects")}</label>
                {config.gitlab.projects.map((p: {id: string; name: string}) => (
                  <div key={p.id} className={styles.projectRow}>
                    <span style={{fontWeight: 600}}>#{p.id}</span>
                    <span style={{flex: 1}}>{p.name}</span>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => handleRemoveProject(p.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}

                <div className={styles.projectRow} style={{marginTop: 8}}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="ID (ej: 259257)"
                    style={{width: 120}}
                    value={newProjId}
                    onChange={(e) => setNewProjId(e.target.value)}
                  />
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Nombre del Proyecto"
                    style={{flex: 1}}
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                  />
                  <button type="button" className={styles.saveBtn} onClick={handleAddProject}>
                    {t("settingsModal.addProject")}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "ai" && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t("settingsModal.aiProvider")}</label>
                <select
                  className={styles.input}
                  value={config.ai.provider}
                  onChange={(e: any) => updateAiConfig({provider: e.target.value})}
                >
                  <option value="gemini">Google Gemini API (Recomendado)</option>
                  <option value="openai">OpenAI API (GPT-4o)</option>
                  <option value="copilot">GitHub Copilot Enterprise (GHE)</option>
                  <option value="ollama">Ollama (Local LLM)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t("settingsModal.aiApiKey")}</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="AI API Key"
                  value={config.ai.apiKey}
                  onChange={(e) => updateAiConfig({apiKey: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t("settingsModal.aiModel")}</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="ej: gemini-1.5-pro / gpt-4o / llama3"
                  value={config.ai.model}
                  onChange={(e) => updateAiConfig({model: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{t("settingsModal.aiBaseUrl")}</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="ej: http://localhost:11434"
                  value={config.ai.baseUrl || ""}
                  onChange={(e) => updateAiConfig({baseUrl: e.target.value})}
                />
              </div>
            </>
          )}

          {activeTab === "rules" && (
            <>
              <p className={styles.label}>{t("settingsModal.rulesDescription")}</p>

              <button
                type="button"
                className={styles.saveBtn}
                style={{alignSelf: "flex-start"}}
                onClick={() => addRuleFile()}
              >
                {t("settingsModal.addRuleBtn")}
              </button>

              <div className={styles.rulesList}>
                {rules.length === 0 ? (
                  <p style={{color: "var(--text-muted)", fontSize: "0.85rem"}}>
                    {t("settingsModal.noRules")}
                  </p>
                ) : (
                  rules.map((r: any) => (
                    <div key={r.name} className={styles.ruleCard}>
                      <div>
                        <div className={styles.ruleName}>📄 {r.name}</div>
                        <div className={styles.rulePath}>{r.path}</div>
                      </div>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => deleteRuleFile(r.name)}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.saveBtn} onClick={handleSave}>
            {t("settingsModal.save")}
          </button>
        </div>
      </div>
    </div>
  );
};
