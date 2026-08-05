import axios from "axios";
import { type Result, err, ok } from "../../../shared/types/result.js";
import type { AiAdapter, AiEvaluationPayload, AiEvaluationResult } from "./aiTypes.js";

export const createGeminiAdapter = (apiKey: string, modelName: string): AiAdapter => {
  return {
    evaluate: async (payload: AiEvaluationPayload): Promise<Result<AiEvaluationResult, string>> => {
      try {
        if (!apiKey) {
          return err(
            "Google Gemini API Key no configurada. Ingrese una API Key en el menú de Configuración.",
          );
        }

        const model = modelName || "gemini-1.5-pro";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const promptText = `
Eres un experto Code Reviewer y Tech Lead asistido por IA. Debes evaluar la siguiente Merge Request.

${payload.rulesContent}

DATOS DE LA MERGE REQUEST:
- Título: ${payload.mrTitle}
- Autor: ${payload.author}
- Descripción: ${payload.mrDescription}
- Lista de Commits: ${JSON.stringify(payload.commits, null, 2)}

DIFFS DEL CÓDIGO:
${payload.diffs}

INSTRUCCIONES DE RESPUESTA:
Debes responder ÚNICAMENTE en formato JSON válido con el siguiente esquema exacto (sin markdown wrappers de bloque de código):
{
  "confidenceScore": 0.95,
  "verdict": "APPROVE",
  "summary": "Resumen conciso del cambio en 2 o 3 líneas en español.",
  "risks": [
    {
      "severity": "HIGH|MEDIUM|LOW",
      "message": "Descripción del riesgo",
      "file": "path/file.ts",
      "line": 42
    }
  ],
  "ruleViolations": [
    {
      "ruleFileName": "nombre_regla.md",
      "message": "Violación detectada"
    }
  ],
  "highlights": [
    "Puntos destacados del cambio"
  ]
}
`;

        const response = await axios.post(
          url,
          {
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          },
          { headers: { "Content-Type": "application/json" } },
        );

        const candidates = response.data?.candidates;
        if (!candidates || candidates.length === 0) {
          return err("Gemini no retornó candidatos de respuesta.");
        }

        const textResponse = candidates[0].content.parts[0].text;
        const cleaned = textResponse
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        const parsed = JSON.parse(cleaned) as AiEvaluationResult;

        return ok(parsed);
      } catch (e: any) {
        return err(`Error en Gemini API: ${e.response?.data?.error?.message || e.message}`);
      }
    },
  };
};
