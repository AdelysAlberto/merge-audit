import path from "path";
import { fileURLToPath } from "url";
import { BrowserWindow, app, dialog, ipcMain } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createAiAdapter } from "./modules/aiProvider/aiFactory.js";
import { loadConfig, saveConfig } from "./modules/config/configStore.js";
import { auditMrAndCommits } from "./modules/conventionAuditor/titleAuditor.js";
import { approveMr, fetchMrDetails, fetchOpenMrs, mergeMr } from "./modules/gitlab/gitlabClient.js";
import { getLogHistory, logToTerminal } from "./modules/logger/loggerStream.js";
import {
  aggregateRulesContent,
  copyRuleFile,
  deleteRuleFile,
  listRuleFiles,
} from "./modules/rulesManager/rulesService.js";

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  const preloadPath = path.join(__dirname, "preload.mjs");

  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 1000,
    minHeight: 650,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#0b0f19",
      symbolColor: "#f9fafb",
    },
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  logToTerminal("INFO", "SYSTEM", "Aplicación merge-audit iniciada correctamente.");
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC Handlers: Config
ipcMain.handle("config:get", async () => {
  const configRes = loadConfig();
  if (configRes.ok) {
    logToTerminal("INFO", "CONFIG", "Configuración cargada de disco.");
    return { ok: true, data: configRes.data };
  }
  logToTerminal("ERROR", "CONFIG", configRes.error);
  return { ok: false, error: configRes.error };
});

ipcMain.handle("config:save", async (_event, newConfig) => {
  const saveRes = saveConfig(newConfig);
  if (saveRes.ok) {
    logToTerminal("INFO", "CONFIG", "Configuración guardada exitosamente.");
    return { ok: true, data: saveRes.data };
  }
  logToTerminal("ERROR", "CONFIG", saveRes.error);
  return { ok: false, error: saveRes.error };
});

// IPC Handlers: Rules (.md)
ipcMain.handle("rules:list", async () => {
  const res = listRuleFiles();
  return res;
});

ipcMain.handle("rules:add", async (_event, filePath?: string) => {
  let targetPath = filePath;

  if (!targetPath && mainWindow) {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Seleccionar Archivo de Regla .md",
      filters: [{ name: "Markdown Rules", extensions: ["md"] }],
      properties: ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { ok: false, error: "Operación cancelada por el usuario." };
    }
    targetPath = result.filePaths[0];
  }

  if (!targetPath) return { ok: false, error: "No se especificó ruta de archivo." };

  const copyRes = copyRuleFile(targetPath);
  if (copyRes.ok) {
    logToTerminal("INFO", "RULES", `Regla importada: ${copyRes.data.name}`);
    return { ok: true, data: copyRes.data };
  }
  logToTerminal("ERROR", "RULES", copyRes.error);
  return { ok: false, error: copyRes.error };
});

ipcMain.handle("rules:delete", async (_event, filename: string) => {
  const delRes = deleteRuleFile(filename);
  if (delRes.ok) {
    logToTerminal("INFO", "RULES", `Regla eliminada: ${filename}`);
    return { ok: true, data: true };
  }
  logToTerminal("ERROR", "RULES", delRes.error);
  return { ok: false, error: delRes.error };
});

// IPC Handlers: GitLab
ipcMain.handle("gitlab:fetchMrs", async (_event, projectId: string) => {
  const configRes = loadConfig();
  const config = configRes.ok ? configRes.data : null;
  const hostUrl = config?.gitlab.hostUrl || "https://gitlab.com";
  const token = config?.gitlab.token || "";

  logToTerminal("GITLAB", "API", `Solicitando MRs abiertas para proyecto #${projectId}...`);
  const mrsRes = await fetchOpenMrs(hostUrl, token, projectId);

  if (mrsRes.ok) {
    logToTerminal("GITLAB", "API", `Recibidas ${mrsRes.data.length} MRs abiertas.`);
  } else {
    logToTerminal("ERROR", "GITLAB", mrsRes.error);
  }

  return mrsRes;
});

ipcMain.handle(
  "gitlab:fetchMrDetails",
  async (_event, projectId: string, mrIid: number, titleFallback?: string) => {
    const configRes = loadConfig();
    const config = configRes.ok ? configRes.data : null;
    const hostUrl = config?.gitlab.hostUrl || "https://gitlab.com";
    const token = config?.gitlab.token || "";

    logToTerminal("GITLAB", "API", `Solicitando detalles, commits y diffs del MR !${mrIid}...`);
    const detailsRes = await fetchMrDetails(hostUrl, token, projectId, mrIid, titleFallback);

    if (detailsRes.ok) {
      const audit = auditMrAndCommits(
        detailsRes.data.mr.title,
        detailsRes.data.commits.map((c) => ({ sha: c.sha, message: c.message })),
      );
      logToTerminal(
        audit.isAllValid ? "INFO" : "WARN",
        "CONVENTION",
        `Auditoría de convenciones para MR !${mrIid}: ${audit.isAllValid ? "CUMPLIMIENTO TOTAL" : "INFRACCIÓN DE REGLAS DETECTADA"}`,
      );
      return {
        ok: true,
        data: {
          ...detailsRes.data,
          conventionAudit: audit,
        },
      };
    }

    logToTerminal("ERROR", "GITLAB", detailsRes.error);
    return detailsRes;
  },
);

ipcMain.handle("gitlab:approveMr", async (_event, projectId: string, mrIid: number) => {
  const configRes = loadConfig();
  const config = configRes.ok ? configRes.data : null;
  const hostUrl = config?.gitlab.hostUrl || "https://gitlab.com";
  const token = config?.gitlab.token || "";

  logToTerminal("GITLAB", "ACTION", `Enviando aprobación para MR !${mrIid}...`);
  const res = await approveMr(hostUrl, token, projectId, mrIid);
  if (res.ok) logToTerminal("INFO", "GITLAB", `MR !${mrIid} Aprobada con éxito.`);
  return res;
});

ipcMain.handle("gitlab:mergeMr", async (_event, projectId: string, mrIid: number) => {
  const configRes = loadConfig();
  const config = configRes.ok ? configRes.data : null;
  const hostUrl = config?.gitlab.hostUrl || "https://gitlab.com";
  const token = config?.gitlab.token || "";

  logToTerminal("GITLAB", "ACTION", `Ejecutando Merge en MR !${mrIid}...`);
  const res = await mergeMr(hostUrl, token, projectId, mrIid);
  if (res.ok) logToTerminal("INFO", "GITLAB", `MR !${mrIid} Fusionada (Merge) exitosamente.`);
  return res;
});

// IPC Handlers: AI Review
ipcMain.handle(
  "ai:evaluateMr",
  async (_event, projectId: string, mrIid: number, titleFallback?: string) => {
    const configRes = loadConfig();
    if (!configRes.ok) return { ok: false, error: configRes.error };
    const config = configRes.data;

    logToTerminal(
      "AI",
      "EVAL",
      `Iniciando evaluación con IA (${config.ai.provider.toUpperCase()} - ${config.ai.model}) para MR !${mrIid}...`,
    );

    // Fetch details
    const detailsRes = await fetchMrDetails(
      config.gitlab.hostUrl,
      config.gitlab.token,
      projectId,
      mrIid,
      titleFallback,
    );
    if (!detailsRes.ok) {
      logToTerminal("ERROR", "AI", detailsRes.error);
      return detailsRes;
    }

    // Aggregate rules
    const rulesRes = aggregateRulesContent();
    const rulesContent = rulesRes.ok ? rulesRes.data : "";

    const { mr, commits, diffs } = detailsRes.data;
    const diffsText = diffs.map((d) => `--- File: ${d.newPath} ---\n${d.diff}`).join("\n\n");

    const adapter = createAiAdapter(config.ai);
    const evalRes = await adapter.evaluate({
      mrTitle: mr.title,
      mrDescription: mr.description,
      author: mr.author.name,
      commits: commits.map((c) => c.message),
      diffs: diffsText,
      rulesContent,
    });

    if (evalRes.ok) {
      logToTerminal(
        "AI",
        "EVAL",
        `Evaluación completada. Confidence Score: ${evalRes.data.confidenceScore}. Veredicto: ${evalRes.data.verdict}`,
      );
    } else {
      logToTerminal("ERROR", "AI", evalRes.error);
    }

    return evalRes;
  },
);

ipcMain.handle("logger:getHistory", async () => {
  return getLogHistory();
});
