import type React from "react";
import { useShallow } from "zustand/react/shallow";
import { t } from "../../shared/i18n/useI18n";
import { ConventionAuditCard } from "../conventionAuditor/ConventionAuditCard";
import { useMrListStore } from "../mrList/mrListStore";
import styles from "./AiReportPanel.module.css";
import { useAiReportStore } from "./aiReportStore";

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return "Desconocida";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
  if (diffHours > 0) return `hace ${diffHours} hr${diffHours > 1 ? "s" : ""}`;
  if (diffMin > 0) return `hace ${diffMin} min`;
  return "hace instantes";
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const AiReportPanel: React.FC = () => {
  const { selectedMrDetails, activeProjectId } = useMrListStore(
    useShallow((state) => ({
      activeProjectId: state.activeProjectId,
      selectedMrDetails: state.selectedMrDetails,
    })),
  );

  const { evaluation, isEvaluating, activeView, setActiveView, evaluateMr, approveMr, mergeMr } =
    useAiReportStore(
      useShallow((state) => ({
        activeView: state.activeView,
        approveMr: state.approveMr,
        evaluateMr: state.evaluateMr,
        evaluation: state.evaluation,
        isEvaluating: state.isEvaluating,
        mergeMr: state.mergeMr,
        setActiveView: state.setActiveView,
      })),
    );

  if (!selectedMrDetails) {
    return (
      <div
        className={styles.panelContainer}
        style={{ alignItems: "center", color: "var(--text-muted)", justifyContent: "center" }}
      >
        👈 Selecciona un Merge Request de la barra lateral para inspeccionar o auditar.
      </div>
    );
  }

  const { mr, diffs, conventionAudit } = selectedMrDetails as any;

  const handleEvaluate = () => {
    evaluateMr(activeProjectId, mr.iid, mr.title);
  };

  const handleApprove = async () => {
    const success = await approveMr(activeProjectId, mr.iid);
    if (success) alert("¡MR Aprobado con éxito!");
  };

  const handleMerge = async () => {
    const success = await mergeMr(activeProjectId, mr.iid);
    if (success) alert("¡MR Fusionado (Merge) exitosamente!");
  };

  const scoreClass = !evaluation
    ? ""
    : evaluation.confidenceScore >= 0.85
      ? styles.scoreHigh
      : evaluation.confidenceScore >= 0.6
        ? styles.scoreMedium
        : styles.scoreLow;

  const labels: string[] = mr.labels || [];
  const isReadyToReview = labels.some((l) => l.toLowerCase().includes("ready to review"));

  const assignedUsers: any[] = [...(mr.reviewers || []), ...(mr.assignees || [])];

  const getReviewerInfo = () => {
    if (assignedUsers.length === 0) {
      return { text: "Sin asignar", type: "none" };
    }
    const myPatterns = ["adelys", "adalbeca", "codechecker", "codecheker"];
    const myUser = assignedUsers.find((u) => {
      const name = (u.name || "").toLowerCase();
      const uname = (u.username || "").toLowerCase();
      return myPatterns.some((p) => name.includes(p) || uname.includes(p));
    });

    if (myUser) {
      return { text: `${myUser.name}`, type: "green" };
    }

    const otherNames = Array.from(new Set(assignedUsers.map((u) => u.name || u.username))).join(
      ", ",
    );
    return { text: otherNames, type: "red" };
  };

  const reviewerInfo = getReviewerInfo();


 
  return (
    <div className={styles.panelContainer}>
      <div className={styles.panelHeader}>
        <div className={styles.mrHeading}>
          <div className={styles.mrMetaRow}>
            <span className={styles.timeBadge} title={`Creada el ${formatDate(mr.createdAt)}`}>
              📅 Creada {formatRelativeTime(mr.createdAt)}
            </span>
            <span
              className={styles.timeBadge}
              title={`Última actualización: ${formatDate(mr.updatedAt)}`}
            >
              🔄 Actualizada {formatRelativeTime(mr.updatedAt)} ({formatDate(mr.updatedAt)})
            </span>
             </div>
            <div className={styles.mrMetaRow}>
            

            {isReadyToReview ? (
              <span className={styles.labelReady}>✅ Ready to Review</span>
            ) : (
              <span className={styles.labelPending}>⏳ Pendiente Ready to Review</span>
            )}

            {reviewerInfo.type === "green" && (
              <span className={styles.reviewerGreen}>👤 Reviewer: {reviewerInfo.text}</span>
            )}
            {reviewerInfo.type === "red" && (
              <span className={styles.reviewerRed}>👤 Reviewer: {reviewerInfo.text}</span>
            )}
            {reviewerInfo.type === "none" && (
              <span className={styles.reviewerNone}>👤 Reviewer: Sin asignar</span>
            )}
          </div>

          <h1 className={styles.mrTitle}>{mr.title}</h1>
          <span className={styles.mrSub}>
            MR !{mr.iid} • Autor: <strong>{mr.author.name}</strong> • URL:{" "}
            <a href={mr.webUrl} target="_blank" rel="noreferrer" className={styles.link}>
              {mr.webUrl}
            </a>
          </span>
        </div>

        <div className={styles.tabSwitch}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeView === "report" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveView("report")}
          >
            📊 Reporte de IA
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeView === "diffs" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveView("diffs")}
          >
            📝 Diffs ({diffs.length})
          </button>
        </div>
      </div>

      <div className={styles.panelContent}>
        {/* Title & Commits Convention Audit Card */}
        {conventionAudit && <ConventionAuditCard audit={conventionAudit} />}

        {activeView === "report" ? (
          <>
            {isEvaluating ? (
              <div style={{ color: "var(--accent-cyan)", padding: 40, textAlign: "center" }}>
                ✨ {t("aiReport.evaluating")}
              </div>
            ) : !evaluation ? (
              <div style={{ color: "var(--text-muted)", padding: 30, textAlign: "center" }}>
                {t("aiReport.noEvaluationYet")}
              </div>
            ) : (
              <>
                <div className={styles.aiGaugeCard}>
                  <div className={styles.gaugeLeft}>
                    <div className={`${styles.scoreBadge} ${scoreClass}`}>
                      {evaluation.confidenceScore.toFixed(2)}
                    </div>
                    <div>
                      <div className={styles.verdictTitle}>
                        Veredicto: <strong>{evaluation.verdict}</strong>
                      </div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        Confianza de Código en escala 0.00 a 1.00
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.summaryBox}>
                  <h3 className={styles.sectionTitle}>📌 {t("aiReport.summary")}</h3>
                  <p
                    style={{ color: "var(--text-primary)", fontSize: "0.9rem", lineHeight: "1.5" }}
                  >
                    {evaluation.summary}
                  </p>
                </div>

                {evaluation.risks && evaluation.risks.length > 0 && (
                  <div className={styles.summaryBox}>
                    <h3 className={styles.sectionTitle}>⚠️ {t("aiReport.risks")}</h3>
                    {evaluation.risks.map((r: any, idx: number) => (
                      <div
                        key={idx}
                        className={`${styles.riskItem} ${
                          r.severity === "HIGH"
                            ? styles.riskHigh
                            : r.severity === "MEDIUM"
                              ? styles.riskMedium
                              : ""
                        }`}
                      >
                        <strong>[{r.severity}]</strong> {r.message}{" "}
                        {r.file && (
                          <span style={{ color: "var(--text-muted)" }}>
                            ({r.file} {r.line ? `:L${r.line}` : ""})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {evaluation.highlights && evaluation.highlights.length > 0 && (
                  <div className={styles.summaryBox}>
                    <h3 className={styles.sectionTitle}>🌟 {t("aiReport.highlights")}</h3>
                    <ul>
                      {evaluation.highlights.map((h: string, idx: number) => (
                        <li key={idx} style={{ fontSize: "0.85rem", marginBottom: 4 }}>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className={styles.diffContainer}>
            {diffs.map((d: any, idx: number) => (
              <div key={idx} style={{ marginBottom: 20 }}>
                <div style={{ color: "var(--accent-cyan)", fontWeight: 700, marginBottom: 6 }}>
                  📄 {d.newPath}
                </div>
                <div>{d.diff}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actionsFooter}>
        <button type="button" className={styles.evalBtn} onClick={handleEvaluate}>
          {t("aiReport.evaluateBtn")}
        </button>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className={styles.approveBtn} onClick={handleApprove}>
            {t("aiReport.approveBtn")}
          </button>
          <button type="button" className={styles.mergeBtn} onClick={handleMerge}>
            {t("aiReport.mergeBtn")}
          </button>
        </div>
      </div>
    </div>
  );
};
