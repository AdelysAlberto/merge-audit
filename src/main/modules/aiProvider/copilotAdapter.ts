import axios from "axios";
import { type Result, err, ok } from "../../../shared/types/result.js";
import { COPILOT_BASE_URL, COPILOT_MODEL } from "../../../utils/conf.js";
import type { AiAdapter, AiEvaluationPayload, AiEvaluationResult } from "./aiTypes.js";

export const createCopilotAdapter = (
  token: string,
  modelName?: string,
  baseUrl?: string,
): AiAdapter => {
  return {
    evaluate: async (payload: AiEvaluationPayload): Promise<Result<AiEvaluationResult, string>> => {
      try {
        if (!token) {
          return err("Token de Copilot Enterprise no configurado.");
        }

        const model = modelName || COPILOT_MODEL;
        const url = (baseUrl || COPILOT_BASE_URL).replace(/\/$/, "") + "/chat/completions";

        const systemPrompt = `Eres un revisor de código experto. Responde ÚNICAMENTE en JSON válido con este esquema:
{
  "confidenceScore": number (0.00-1.00),
  "verdict": "APPROVE" | "NEEDS_CHANGES" | "REJECT",
  "summary": string,
  "risks": [{ "severity": "HIGH"|"MEDIUM"|"LOW", "message": string, "file": string, "line": number }],
  "ruleViolations": [{ "ruleFileName": string, "message": string }],
  "highlights": [string]
}`;

        const userPrompt = `
${payload.rulesContent}
MR Title: ${payload.mrTitle}
Author: ${payload.author}
Description: ${payload.mrDescription}
Commits: ${JSON.stringify(payload.commits)}
Diffs:
${payload.diffs}
`;

        const response = await axios.post(
          url,
          {
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) return err("Copilot no retornó contenido.");

        const cleaned = content
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        const parsed = JSON.parse(cleaned) as AiEvaluationResult;
        return ok(parsed);
      } catch (e: any) {
        return err(`Error en Copilot Enterprise: ${e.response?.data?.message || e.message}`);
      }
    },
  };
};
