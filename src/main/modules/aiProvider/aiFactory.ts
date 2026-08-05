import type { AppConfig } from "../config/configTypes.js";
import type { AiAdapter } from "./aiTypes.js";
import { createGeminiAdapter } from "./geminiAdapter.js";
import { createOllamaAdapter } from "./ollamaAdapter.js";
import { createOpenAiAdapter } from "./openaiAdapter.js";

export const createAiAdapter = (aiConfig: AppConfig["ai"]): AiAdapter => {
  switch (aiConfig.provider) {
    case "gemini":
      return createGeminiAdapter(aiConfig.apiKey, aiConfig.model);
    case "openai":
      return createOpenAiAdapter(aiConfig.apiKey, aiConfig.model, aiConfig.baseUrl);
    case "ollama":
      return createOllamaAdapter(aiConfig.model, aiConfig.baseUrl);
    default:
      return createGeminiAdapter(aiConfig.apiKey, aiConfig.model);
  }
};
