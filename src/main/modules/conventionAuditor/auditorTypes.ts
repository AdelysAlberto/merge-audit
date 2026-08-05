export interface MrTitleAudit {
  rawTitle: string;
  isValid: boolean;
  taskId?: string;
  portal?: string;
  module?: string;
  type?: string;
  shortDescription?: string;
  errorReason?: string;
}

export interface CommitAudit {
  sha: string;
  rawMessage: string;
  isValid: boolean;
  taskId?: string;
  type?: string;
  description?: string;
  errorReason?: string;
}

export interface ConventionAuditResult {
  mrTitle: MrTitleAudit;
  commits: CommitAudit[];
  isAllValid: boolean;
  totalCommits: number;
  invalidCommitsCount: number;
}
