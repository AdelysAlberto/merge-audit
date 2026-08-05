import axios from "axios";
import { type Result, err, ok } from "../../../shared/types/result.js";
import type { AiAdapter, AiEvaluationPayload, AiEvaluationResult } from "./aiTypes.js";

export const createOpenAiAdapter = (
  apiKey: string,
  modelName: string,
  baseUrl?: string,
): AiAdapter => {
  return {
    evaluate: async (payload: AiEvaluationPayload): Promise<Result<AiEvaluationResult, string>> => {
      try {
        if (!apiKey) {
          return err("OpenAI API Key no configurada.");
        }

        const model = modelName || "gpt-4o";
        const url =
          (baseUrl || "https://api.openai.com/v1").replace(/\/$/, "") + "/chat/completions";

        const systemPrompt = `Eres un experto Code Reviewer. Responde ÚNICAMENTE en JSON con el esquema:
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
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          },
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) return err("OpenAI API no retornó contenido.");

        const parsed = JSON.parse(content) as AiEvaluationResult;
        return ok(parsed);
      } catch (e: any) {
        return err(`Error en OpenAI API: ${e.response?.data?.error?.message || e.message}`);
      }
    },
  };
};
