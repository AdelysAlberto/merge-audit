import fs from "fs";
import path from "path";
import { type Result, err, ok } from "../../../shared/types/result.js";
import { loadConfig } from "../config/configStore.js";
import type { RuleFile } from "./rulesTypes.js";

export const listRuleFiles = (): Result<RuleFile[], string> => {
  try {
    const configRes = loadConfig();
    if (!configRes.ok) return err(configRes.error);
    const rulesDir = configRes.data.rulesDirectoryPath;

    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir, { recursive: true });
    }

    const files = fs.readdirSync(rulesDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    const ruleFiles: RuleFile[] = mdFiles.map((filename) => {
      const fullPath = path.join(rulesDir, filename);
      const stat = fs.statSync(fullPath);
      return {
        name: filename,
        path: fullPath,
        sizeBytes: stat.size,
        updatedAt: stat.mtime.toISOString(),
      };
    });

    return ok(ruleFiles);
  } catch (e: any) {
    return err(`Error al listar reglas .md: ${e.message}`);
  }
};

export const copyRuleFile = (sourceFilePath: string): Result<RuleFile, string> => {
  try {
    if (!fs.existsSync(sourceFilePath)) {
      return err(`El archivo origen no existe: ${sourceFilePath}`);
    }
    const filename = path.basename(sourceFilePath);
    if (!filename.endsWith(".md")) {
      return err("Solo se permiten archivos con extensión .md");
    }

    const configRes = loadConfig();
    if (!configRes.ok) return err(configRes.error);
    const rulesDir = configRes.data.rulesDirectoryPath;

    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir, { recursive: true });
    }

    const destPath = path.join(rulesDir, filename);
    fs.copyFileSync(sourceFilePath, destPath);

    const stat = fs.statSync(destPath);
    return ok({
      name: filename,
      path: destPath,
      sizeBytes: stat.size,
      updatedAt: stat.mtime.toISOString(),
    });
  } catch (e: any) {
    return err(`Error al copiar archivo de regla: ${e.message}`);
  }
};

export const deleteRuleFile = (filename: string): Result<boolean, string> => {
  try {
    const configRes = loadConfig();
    if (!configRes.ok) return err(configRes.error);
    const rulesDir = configRes.data.rulesDirectoryPath;
    const filePath = path.join(rulesDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return ok(true);
    }
    return err(`Archivo de regla no encontrado: ${filename}`);
  } catch (e: any) {
    return err(`Error al eliminar regla: ${e.message}`);
  }
};

export const aggregateRulesContent = (): Result<string, string> => {
  try {
    const listRes = listRuleFiles();
    if (!listRes.ok) return err(listRes.error);
    if (listRes.data.length === 0) return ok("");

    let combined = "## REGLAS Y CONVENCIONES DEL EQUIPO (Cargadas desde archivos .md locales):\n\n";
    for (const file of listRes.data) {
      const content = fs.readFileSync(file.path, "utf-8");
      combined += `--- INICIO DE REGLA: ${file.name} ---\n${content}\n--- FIN DE REGLA: ${file.name} ---\n\n`;
    }
    return ok(combined);
  } catch (e: any) {
    return err(`Error al leer contenido de reglas: ${e.message}`);
  }
};
