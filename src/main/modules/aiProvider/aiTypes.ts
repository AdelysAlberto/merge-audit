export interface AiRisk {
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  file?: string;
  line?: number;
}

export interface AiRuleViolation {
  ruleFileName: string;
  message: string;
}

export interface AiEvaluationResult {
  confidenceScore: number; // 0.00 a 1.00
  verdict: "APPROVE" | "NEEDS_CHANGES" | "REJECT";
  summary: string;
  risks: AiRisk[];
  ruleViolations: AiRuleViolation[];
  highlights: string[];
}

export interface AiEvaluationPayload {
  mrTitle: string;
  mrDescription: string;
  author: string;
  diffs: string;
  commits: string[];
  rulesContent: string;
}

export type AiAdapter = {
  evaluate: (
    payload: AiEvaluationPayload,
  ) => Promise<{ ok: true; data: AiEvaluationResult } | { ok: false; error: string }>;
};
