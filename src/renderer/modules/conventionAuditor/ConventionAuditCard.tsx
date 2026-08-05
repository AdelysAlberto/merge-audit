import type { ConventionAuditResult } from "@/main/modules/conventionAuditor/auditorTypes.ts";
import type React from "react";
import styles from "./ConventionAuditCard.module.css";

interface ConventionAuditCardProps {
  audit: ConventionAuditResult;
}

export const ConventionAuditCard: React.FC<ConventionAuditCardProps> = ({ audit }) => {
  const { mrTitle, commits, isAllValid } = audit;

  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span>🎯 Auditoría de Convención de Títulos y Commits</span>
        </div>
        <span
          className={`${styles.statusBadge} ${
            isAllValid ? styles.statusValid : styles.statusInvalid
          }`}
        >
          {isAllValid ? "✓ CUMPLIMIENTO TOTAL" : "⚠ INFRACCIÓN DE REGLAS"}
        </span>
      </div>

      {mrTitle.isValid ? (
        <div className={styles.breakdownGrid}>
          <div className={styles.gridItem}>
            <span className={styles.gridLabel}>TaskId</span>
            <span className={styles.gridValue}>#{mrTitle.taskId}</span>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.gridLabel}>Portal</span>
            <span className={styles.gridValue}>[{mrTitle.portal}]</span>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.gridLabel}>Module</span>
            <span className={styles.gridValue}>[{mrTitle.module}]</span>
          </div>
          <div className={styles.gridItem}>
            <span className={styles.gridLabel}>Type</span>
            <span className={styles.gridValue}>[{mrTitle.type}]</span>
          </div>
        </div>
      ) : (
        <div className={styles.reasonBox}>
          <strong>Error en Título de MR:</strong> {mrTitle.errorReason}
        </div>
      )}

      <div className={styles.commitsList}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
          Commits del MR ({commits.length}):
        </div>
        {commits.map((c: any) => (
          <div key={c.sha} className={styles.commitRow}>
            <span className={styles.commitSha}>{c.sha.substring(0, 7)}</span>
            <span className={styles.commitMsg}>{c.rawMessage}</span>
            <span
              style={{
                fontSize: "0.75rem",
                color: c.isValid ? "var(--color-success)" : "var(--color-danger)",
                fontWeight: 600,
              }}
            >
              {c.isValid ? "✓ OK" : "⚠ Inválido"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
