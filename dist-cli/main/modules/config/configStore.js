import fs from "fs";
import os from "os";
import path from "path";
import { err, ok } from "../../../shared/types/result.js";
import { COPILOT_BASE_URL, COPILOT_MODEL, COPILOT_TOKEN_IA, ENV_AI_MODEL, ENV_AI_PROVIDER, GITLAB_TOKEN, USE_GITLAB_TOKEN_FOR_COPILOT, } from "../../../utils/conf.js";
import { defaultConfig } from "./configTypes.js";
const resolveAiModel = (provider, currentModel) => {
    if (ENV_AI_MODEL) {
        return ENV_AI_MODEL;
    }
    if (provider === "copilot") {
        return COPILOT_MODEL;
    }
    return currentModel;
};
const applyAiEnvOverrides = (ai, gitlabToken) => {
    const provider = ENV_AI_PROVIDER || ai.provider;
    const normalized = {
        ...ai,
        provider,
    };
    if (provider === "copilot") {
        const copilotApiKey = USE_GITLAB_TOKEN_FOR_COPILOT
            ? gitlabToken || COPILOT_TOKEN_IA || normalized.apiKey
            : COPILOT_TOKEN_IA || gitlabToken || normalized.apiKey;
        return {
            ...normalized,
            apiKey: copilotApiKey,
            baseUrl: normalized.baseUrl || COPILOT_BASE_URL,
            model: resolveAiModel(provider, normalized.model),
        };
    }
    return {
        ...normalized,
        model: resolveAiModel(provider, normalized.model),
    };
};
const getConfigDir = () => {
    const homeDir = os.homedir();
    return path.join(homeDir, ".config", "merge-audit");
};
const getConfigFile = () => {
    return path.join(getConfigDir(), "config.json");
};
export const ensureConfigDirExists = () => {
    try {
        const dir = getConfigDir();
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const rulesDir = path.join(dir, "rules");
        if (!fs.existsSync(rulesDir)) {
            fs.mkdirSync(rulesDir, { recursive: true });
        }
        return ok(dir);
    }
    catch (e) {
        return err(`No se pudo crear la carpeta de configuración: ${e.message}`);
    }
};
export const loadConfig = () => {
    try {
        ensureConfigDirExists();
        const configFile = getConfigFile();
        if (!fs.existsSync(configFile)) {
            const initialConfig = {
                ...defaultConfig,
                gitlab: {
                    ...defaultConfig.gitlab,
                    token: defaultConfig.gitlab.token || GITLAB_TOKEN,
                },
                ai: {
                    ...applyAiEnvOverrides(defaultConfig.ai, defaultConfig.gitlab.token || GITLAB_TOKEN),
                },
                rulesDirectoryPath: path.join(getConfigDir(), "rules"),
            };
            fs.writeFileSync(configFile, JSON.stringify(initialConfig, null, 2), "utf-8");
            return ok(initialConfig);
        }
        const data = fs.readFileSync(configFile, "utf-8");
        const parsed = JSON.parse(data);
        parsed.gitlab.token = parsed.gitlab.token || GITLAB_TOKEN;
        parsed.ai = applyAiEnvOverrides(parsed.ai, parsed.gitlab.token);
        if (!parsed.rulesDirectoryPath) {
            parsed.rulesDirectoryPath = path.join(getConfigDir(), "rules");
        }
        if (parsed.gitlab?.projects &&
            parsed.gitlab.projects.length > 0 &&
            (!parsed.gitlab.activeProjectId ||
                !parsed.gitlab.projects.some((p) => p.id === parsed.gitlab.activeProjectId))) {
            parsed.gitlab.activeProjectId = parsed.gitlab.projects[0].id;
        }
        return ok(parsed);
    }
    catch (e) {
        return err(`Error al cargar la configuración: ${e.message}`);
    }
};
export const saveConfig = (newConfig) => {
    try {
        ensureConfigDirExists();
        const configFile = getConfigFile();
        fs.writeFileSync(configFile, JSON.stringify(newConfig, null, 2), "utf-8");
        return ok(newConfig);
    }
    catch (e) {
        return err(`Error al guardar la configuración: ${e.message}`);
    }
};
