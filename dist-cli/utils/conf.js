import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
const findEnvFile = () => {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
        path.resolve(process.cwd(), ".env"),
        path.resolve(currentDir, "../../.env"),
        path.resolve(currentDir, "../../../.env"),
        path.resolve(currentDir, "../.env"),
        path.resolve(os.homedir(), ".config/merge-audit/.env"),
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
};
const loadEnvFromFile = () => {
    const envFilePath = findEnvFile();
    if (!envFilePath) {
        return;
    }
    const envContent = fs.readFileSync(envFilePath, "utf-8");
    const lines = envContent.split(/\r?\n/);
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) {
            continue;
        }
        const separatorIndex = line.indexOf("=");
        if (separatorIndex <= 0) {
            continue;
        }
        const key = line.slice(0, separatorIndex).trim();
        const valueWithQuotes = line.slice(separatorIndex + 1).trim();
        const value = valueWithQuotes.replace(/^['\"]|['\"]$/g, "");
        process.env[key] = value;
    }
};
loadEnvFromFile();
const readEnv = (key) => {
    return process.env[key]?.trim() ?? "";
};
const readEnvAny = (keys) => {
    for (const key of keys) {
        const value = readEnv(key);
        if (value) {
            return value;
        }
    }
    return "";
};
const readEnvBoolean = (key) => {
    const value = readEnv(key).toLowerCase();
    return value === "1" || value === "true" || value === "yes";
};
const isAiProvider = (value) => {
    return ["gemini", "openai", "ollama", "copilot"].includes(value);
};
const readAiProvider = () => {
    const rawProvider = readEnv("MERGE_AUDIT_AI_PROVIDER").toLowerCase();
    return isAiProvider(rawProvider) ? rawProvider : "";
};
export const GITLAB_TOKEN = readEnvAny(["MERGE_AUDIT_GITLAB_TOKEN", "GITLAB_TOKEN"]);
export const GITLAB_HOST_URL = readEnvAny(["MERGE_AUDIT_GITLAB_HOST", "GITLAB_HOST_URL"]) || "http://bos-gitlab.sicemadrid.com";
export const COPILOT_TOKEN_IA = readEnvAny(["MERGE_AUDIT_COPILOT_TOKEN", "COPILOT_TOKEN_IA"]);
export const COPILOT_BASE_URL = readEnv("MERGE_AUDIT_COPILOT_BASE_URL") || "https://sice-tys.ghe.com/api/v3/copilot";
export const COPILOT_MODEL = readEnv("MERGE_AUDIT_COPILOT_MODEL") || "gpt-4o";
export const ENV_AI_PROVIDER = readAiProvider();
export const ENV_AI_MODEL = readEnvAny(["MERGE_AUDIT_AI_MODEL", "MODEL_IA"]);
export const USE_GITLAB_TOKEN_FOR_COPILOT = readEnvBoolean("MERGE_AUDIT_USE_GITLAB_TOKEN_FOR_COPILOT");
export const GITLAB_GE_TOKEN = readEnvAny(["GITLAB_GE_TOKEN", "GITLAB_GE_TOKEN"]);
