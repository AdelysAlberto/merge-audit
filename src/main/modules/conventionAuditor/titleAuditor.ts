import type { CommitAudit, ConventionAuditResult, MrTitleAudit } from "./auditorTypes.js";

// MR Title regex: #<TaskId> [<Portal>][<Module>][<Type>] <Short description>
// Strictly requires space after #<TaskId> (NO dashes allowed). Spaces between brackets are optional.
const MR_TITLE_REGEX =
  /^#(?<taskId>\d+)\s+\[(?<portal>[^\]]+)\]\s*\[(?<module>[^\]]+)\]\s*\[(?<type>[^\]]+)\]\s+(?<shortDescription>.+)$/i;

// Commit message regex: #<TaskId> [-:] <description> or #<TaskId> <type>: <description>
const COMMIT_REGEX =
  /^#(?<taskId>\d+)(?:\s*[-:]\s*|\s+)(?:(?<type>feat|fix|refactor|test|chore|style|docs|perf|ci|build|revert)[:\s]+)?(?<description>.+)$/i;

export const auditMrTitle = (title: string): MrTitleAudit => {
  const trimmed = title.trim();
  const match = trimmed.match(MR_TITLE_REGEX);

  if (!match || !match.groups) {
    return {
      rawTitle: title,
      isValid: false,
      errorReason:
        "Formato esperado: #<TaskId> [<Portal>][<Module>][<Type>] <Descripción corta> (ej: #259723 [PRIVATE][LOGISTICS][FEAT] TAG orders reconciliation)",
    };
  }

  const { taskId, portal, module, type, shortDescription } = match.groups;
  return {
    rawTitle: title,
    isValid: true,
    taskId,
    portal,
    module,
    type: type.toUpperCase(),
    shortDescription,
  };
};

export const auditCommitMessage = (sha: string, message: string): CommitAudit => {
  // First line of commit message
  const firstLine = message.split("\n")[0].trim();

  // Allow automatic Git / GitLab merge commits (e.g. Merge branch 'develop' into feature/260488)
  if (/^merge\s+/i.test(firstLine)) {
    return {
      sha,
      rawMessage: firstLine,
      isValid: true,
      type: "merge",
      description: firstLine,
    };
  }

  const match = firstLine.match(COMMIT_REGEX);

  if (!match || !match.groups) {
    return {
      sha,
      rawMessage: firstLine,
      isValid: false,
      errorReason:
        "Formato esperado: #<TaskId> <descripción> o #<TaskId> <tipo>: <descripción> (ej: #260488 update pnpm-lock.yaml)",
    };
  }

  const { taskId, type, description } = match.groups;
  return {
    sha,
    rawMessage: firstLine,
    isValid: true,
    taskId,
    type: type ? type.toLowerCase() : "commit",
    description,
  };
};

export const auditMrAndCommits = (
  mrTitle: string,
  commits: { sha: string; message: string }[],
): ConventionAuditResult => {
  const auditedTitle = auditMrTitle(mrTitle);
  const auditedCommits = commits.map((c) => auditCommitMessage(c.sha, c.message));

  const invalidCommitsCount = auditedCommits.filter((c) => !c.isValid).length;
  const isAllValid = auditedTitle.isValid && invalidCommitsCount === 0;

  return {
    mrTitle: auditedTitle,
    commits: auditedCommits,
    isAllValid,
    totalCommits: commits.length,
    invalidCommitsCount,
  };
};
