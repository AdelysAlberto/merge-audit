import axios from "axios";
import { type Result, err, ok } from "../../../shared/types/result.js";
import type { AiAdapter, AiEvaluationPayload, AiEvaluationResult } from "./aiTypes.js";

export const createOllamaAdapter = (modelName: string, baseUrl?: string): AiAdapter => {
  return {
    evaluate: async (payload: AiEvaluationPayload): Promise<Result<AiEvaluationResult, string>> => {
      try {
        const model = modelName || "llama3";
        const url = (baseUrl || "http://localhost:11434").replace(/\/$/, "") + "/api/generate";

        const promptText = `
SYSTEM: Eres un Code Reviewer en español. Responde estrictamente en JSON válido sin bloques markdown.
ESQUEMA JSON OBLIGATORIO:
{
  "confidenceScore": 0.85,
  "verdict": "APPROVE",
  "summary": "Resumen conciso",
  "risks": [],
  "ruleViolations": [],
  "highlights": []
}

REGLAS: ${payload.rulesContent}
MR: ${payload.mrTitle} (Autor: ${payload.author})
DIFFS:
${payload.diffs}
`;

        const response = await axios.post(
          url,
          {
            model,
            prompt: promptText,
            stream: false,
            format: "json",
          },
          { headers: { "Content-Type": "application/json" } },
        );

        const responseText = response.data?.response;
        if (!responseText) return err("Ollama no devolvió respuesta.");

        const cleaned = responseText
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        const parsed = JSON.parse(cleaned) as AiEvaluationResult;
        return ok(parsed);
      } catch (e: any) {
        return err(`Error conectando con Ollama Local: ${e.message}`);
      }
    },
  };
};
