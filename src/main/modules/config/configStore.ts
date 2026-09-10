import fs from "fs";
import os from "os";
import path from "path";
import {type Result, err, ok} from "../../../shared/types/result.js";
import {
  COPILOT_BASE_URL,
  COPILOT_MODEL,
  COPILOT_TOKEN_IA,
  ENV_AI_MODEL,
  ENV_AI_PROVIDER,
  GITLAB_HOST_URL,
  GITLAB_TOKEN,
  USE_GITLAB_TOKEN_FOR_COPILOT,
} from "../../../utils/conf.js";
import {type AppConfig, defaultConfig} from "./configTypes.js";

const resolveAiModel = (provider: AppConfig["ai"]["provider"], currentModel: string): string => {
  if (ENV_AI_MODEL) {
    return ENV_AI_MODEL;
  }
  if (provider === "copilot") {
    return COPILOT_MODEL;
  }
  return currentModel;
};

const applyAiEnvOverrides = (ai: AppConfig["ai"], gitlabToken?: string): AppConfig["ai"] => {
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

const getConfigDir = (): string => {
  const homeDir = os.homedir();
  return path.join(homeDir, ".config", "merge-audit");
};

const getConfigFile = (): string => {
  return path.join(getConfigDir(), "config.json");
};

export const ensureConfigDirExists = (): Result<string, string> => {
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
  } catch (e: any) {
    return err(`No se pudo crear la carpeta de configuración: ${e.message}`);
  }
};

export const loadConfig = (): Result<AppConfig, string> => {
  try {
    ensureConfigDirExists();
    const configFile = getConfigFile();
    if (!fs.existsSync(configFile)) {
      const initialConfig: AppConfig = {
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
    const parsed = JSON.parse(data) as AppConfig;
    const originalToken = parsed.gitlab?.token;
    parsed.gitlab.token = GITLAB_TOKEN || parsed.gitlab.token;
    if (
      GITLAB_HOST_URL &&
      (!parsed.gitlab.hostUrl || parsed.gitlab.hostUrl === "https://gitlab.com")
    ) {
      parsed.gitlab.hostUrl = GITLAB_HOST_URL;
    }
    parsed.ai = applyAiEnvOverrides(parsed.ai, parsed.gitlab.token);

    if (GITLAB_TOKEN && originalToken !== GITLAB_TOKEN) {
      try {
        fs.writeFileSync(configFile, JSON.stringify(parsed, null, 2), "utf-8");
      } catch {
        // Silently continue
      }
    }
    if (!parsed.rulesDirectoryPath) {
      parsed.rulesDirectoryPath = path.join(getConfigDir(), "rules");
    }
    if (
      parsed.gitlab?.projects &&
      parsed.gitlab.projects.length > 0 &&
      (!parsed.gitlab.activeProjectId ||
        !parsed.gitlab.projects.some((p) => p.id === parsed.gitlab.activeProjectId))
    ) {
      parsed.gitlab.activeProjectId = parsed.gitlab.projects[0].id;
    }
    return ok(parsed);
  } catch (e: any) {
    return err(`Error al cargar la configuración: ${e.message}`);
  }
};

export const saveConfig = (newConfig: AppConfig): Result<AppConfig, string> => {
  try {
    ensureConfigDirExists();
    const configFile = getConfigFile();
    fs.writeFileSync(configFile, JSON.stringify(newConfig, null, 2), "utf-8");
    return ok(newConfig);
  } catch (e: any) {
    return err(`Error al guardar la configuración: ${e.message}`);
  }
};
