import fs from "fs";
import os from "os";
import path from "path";
import { type Result, err, ok } from "../../../shared/types/result.js";
import { type AppConfig, defaultConfig } from "./configTypes.js";

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
        rulesDirectoryPath: path.join(getConfigDir(), "rules"),
      };
      fs.writeFileSync(configFile, JSON.stringify(initialConfig, null, 2), "utf-8");
      return ok(initialConfig);
    }
    const data = fs.readFileSync(configFile, "utf-8");
    const parsed = JSON.parse(data) as AppConfig;
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
