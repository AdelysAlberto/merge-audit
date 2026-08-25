#!/usr/bin/env node

import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import os from "node:os";
import path from "node:path";
import {stdin as input, stdout as output} from "node:process";
import {createInterface} from "node:readline/promises";
import {fileURLToPath} from "node:url";
import {loadConfig} from "../main/modules/config/configStore.js";
import {fetchOpenMrs} from "../main/modules/gitlab/gitlabClient.js";
import type {GitLabMergeRequest} from "../main/modules/gitlab/gitlabTypes.js";
import systemPlan from "../utils/system-plan.json" with {type: "json"};

type SystemPlan = {
  reviewers: string[];
  labels: string[];
  obsidianPath: string;
  sprints: Array<{
    number: number;
    startDate: string;
  }>;
};

type CliMr = {
  projectId: string;
  title: string;
  author: string;
  link: string;
  status: string;
  mrId: number;
};

const cliName = "vet";
const currentFilePath = fileURLToPath(import.meta.url);
const cliDir = path.dirname(currentFilePath);
const repoRoot = path.resolve(cliDir, "../..");
const wrapperDirectory = path.join(os.homedir(), ".local", "bin");
const wrapperPath = path.join(wrapperDirectory, cliName);
const cliEntrypointPath = path.resolve(repoRoot, "dist-cli/cli/index.js");

const normalizeText = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
};

const matchesReviewerAlias = (reviewerName: string, reviewerAlias: string): boolean => {
  const normalizedReviewerName = normalizeText(reviewerName);
  const normalizedAlias = normalizeText(reviewerAlias);
  const aliasWords = normalizedAlias.split(/\s+/).filter(Boolean);

  if (aliasWords.length === 0) {
    return false;
  }

  return aliasWords.every((aliasWord) => normalizedReviewerName.includes(aliasWord));
};

const capitalize = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getSpanishMonthName = (date: Date): string => {
  return capitalize(new Intl.DateTimeFormat("es-ES", { month: "long" }).format(date));
};

const getSprintFolderName = (sprintNumber: number, sprintDate: Date): string => {
  return `Sprint-${sprintNumber}-${sprintDate.getDate()}${getSpanishMonthName(sprintDate)}`;
};

const getSprintForDate = (
  plan: SystemPlan,
  currentDate: Date,
): { number: number; startDate: Date } => {
  const sortedSprints = [...plan.sprints]
    .map((sprint) => ({
      number: sprint.number,
      startDate: new Date(`${sprint.startDate}T00:00:00`),
    }))
    .sort((left, right) => left.startDate.getTime() - right.startDate.getTime());

  const currentTime = currentDate.getTime();
  const latestSprint =
    sortedSprints.filter((sprint) => sprint.startDate.getTime() <= currentTime).at(-1) ??
    sortedSprints[0];

  if (!latestSprint) {
    throw new Error("No hay sprint configurado en src/utils/system-plan.json.");
  }

  return latestSprint;
};

const buildDailyNotePath = (plan: SystemPlan, currentDate: Date): string => {
  const year = String(currentDate.getFullYear());
  const month = getSpanishMonthName(currentDate);
  const sprint = getSprintForDate(plan, currentDate);
  const sprintFolder = getSprintFolderName(sprint.number, sprint.startDate);
  const dailyFileName = `${currentDate.toISOString().slice(0, 10)}.md`;
  return path.join(plan.obsidianPath, year, month, sprintFolder, dailyFileName);
};

const ensureParentDirectory = (filePath: string): void => {
  mkdirSync(path.dirname(filePath), { recursive: true });
};

const extractMrIdFromLink = (link: string): string => {
  const match = link.match(/\/merge_requests\/(\d+)$/);
  return match?.[1] ?? "";
};

const buildStatusLabel = (mr: GitLabMergeRequest): string => {
  if (mr.hasConflicts) {
    return "Conflicts detected";
  }

  switch (mr.pipelineStatus) {
    case "success":
      return "Ready for merge";
    case "failed":
      return "Pipeline failed";
    case "running":
      return "Pipeline in progress";
    case "canceled":
      return "Pipeline canceled";
    case "skipped":
      return "Pipeline skipped";
    default:
      return "Pipeline status unavailable";
  }
};

const matchesPlanFilters = (mr: GitLabMergeRequest, plan: SystemPlan): boolean => {
  const allowedReviewers = plan.reviewers;
  const allowedLabels = new Set(plan.labels.map(normalizeText));
  const reviewerMatch = (mr.reviewers ?? []).some((reviewer) =>
    allowedReviewers.some((allowedReviewer) => matchesReviewerAlias(reviewer.name, allowedReviewer)),
  );
  const labelMatch = (mr.labels ?? []).some((label) => allowedLabels.has(normalizeText(label)));
  return reviewerMatch && labelMatch;
};

const formatMrBlock = (mr: CliMr): string => {
  return [
    `Title: ${mr.title}`,
    `Author: ${mr.author}`,
    `Link: ${mr.link}`,
    `Status: ${mr.status}`,
    "------",
  ].join("\n");
};

const formatObsidianEntry = (mr: CliMr): string => {
  return [`${mr.title}`, `${mr.link}`, `${mr.author}`].join("\n");
};

const readExistingMrIds = (filePath: string): Set<string> => {
  if (!existsSync(filePath)) {
    return new Set<string>();
  }

  const content = readFileSync(filePath, "utf-8");
  const matches = [...content.matchAll(/\/merge_requests\/(\d+)/g)];
  return new Set(matches.map((match) => match[1]));
};

const appendMrsToObsidian = (mrs: CliMr[], plan: SystemPlan, currentDate: Date): number => {
  const notePath = buildDailyNotePath(plan, currentDate);
  ensureParentDirectory(notePath);

  const existingIds = readExistingMrIds(notePath);
  const newEntries = mrs.filter((mr) => !existingIds.has(String(mr.mrId)));

  if (newEntries.length === 0) {
    return 0;
  }

  const existingContent = existsSync(notePath) ? readFileSync(notePath, "utf-8").trim() : "";
  const entriesContent = newEntries.map(formatObsidianEntry).join("\n\n");
  const nextContent = existingContent
    ? `${existingContent}\n\n${entriesContent}\n`
    : `${entriesContent}\n`;
  writeFileSync(notePath, nextContent, "utf-8");
  return newEntries.length;
};

const askForConfirmation = async (): Promise<boolean> => {
  const terminal = createInterface({ input, output });

  try {
    while (true) {
      const answer = (
        await terminal.question("¿Desea agregar estas MR a Obsidian? [Y/N]: ")
      ).trim();
      const normalizedAnswer = answer.toLowerCase();
      if (normalizedAnswer === "y") {
        return true;
      }
      if (normalizedAnswer === "n") {
        return false;
      }
      output.write("Comando inválido. Responda solo Y o N.\n");
    }
  } finally {
    terminal.close();
  }
};

const getFilteredMrs = async (): Promise<CliMr[]> => {
  const configResult = loadConfig();
  if (!configResult.ok) {
    throw new Error(configResult.error);
  }

  const config = configResult.data;
  if (!config.gitlab.projects.length) {
    throw new Error("No hay proyectos GitLab configurados.");
  }

  const mrResults = await Promise.all(
    config.gitlab.projects.map(async (project) => {
      const result = await fetchOpenMrs(config.gitlab.hostUrl, config.gitlab.token, project.id);
      if (!result.ok) {
        throw new Error(result.error);
      }

      return result.data
        .filter((mr) => matchesPlanFilters(mr, systemPlan as SystemPlan))
        .map((mr) => ({
          projectId: project.id,
          title: mr.title,
          author: mr.author.name,
          link: mr.webUrl,
          status: buildStatusLabel(mr),
          mrId: mr.iid || Number(extractMrIdFromLink(mr.webUrl)),
        }));
    }),
  );

  return mrResults.flat().sort((left, right) => left.title.localeCompare(right.title));
};

const printMrs = (mrs: CliMr[]): void => {
  output.write(`MR encontradas: ${mrs.length}\n\n`);
  if (mrs.length === 0) {
    output.write("No hay MRs que cumplan con reviewers y labels configurados.\n");
    return;
  }

  const report = mrs.map(formatMrBlock).join("\n");
  output.write(`${report}\n`);
};

const getUsageText = (): string => {
  return [
    "Uso:",
    "  vet install",
    "  vet check mr",
    "  vet push",
    "  vet update",
    "  vet uninstall",
  ].join("\n");
};

const ensureCliBuild = (): void => {
  execFileSync("pnpm", ["exec", "tsc", "-p", "tsconfig.cli.json"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
};

const installCli = (): void => {
  ensureCliBuild();
  mkdirSync(wrapperDirectory, { recursive: true });
  const wrapperContent = ["#!/usr/bin/env bash", `node "${cliEntrypointPath}" "$@"`].join("\n");
  writeFileSync(wrapperPath, `${wrapperContent}\n`, { encoding: "utf-8", mode: 0o755 });
  output.write(`Comando instalado en ${wrapperPath}\n`);
};

const uninstallCli = (): void => {
  if (existsSync(wrapperPath)) {
    rmSync(wrapperPath);
    output.write(`Comando eliminado de ${wrapperPath}\n`);
    return;
  }

  output.write("El comando vet no está instalado en ~/.local/bin.\n");
};

const runCheckMrCommand = async (): Promise<void> => {
  const mrs = await getFilteredMrs();
  printMrs(mrs);
};

const runPushCommand = async (): Promise<void> => {
  const mrs = await getFilteredMrs();
  printMrs(mrs);

  if (mrs.length === 0) {
    return;
  }

  const shouldPush = await askForConfirmation();
  if (!shouldPush) {
    output.write("Operación cancelada por el usuario.\n");
    return;
  }

  const insertedEntries = appendMrsToObsidian(mrs, systemPlan as SystemPlan, new Date());
  output.write(`Registros agregados a Obsidian: ${insertedEntries}\n`);
};

const run = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const [firstArg = "", secondArg = ""] = args;

  try {
    if (!firstArg || firstArg === "help" || firstArg === "--help" || firstArg === "-h") {
      output.write(`${getUsageText()}\n`);
      return;
    }

    if (firstArg === "install") {
      installCli();
      return;
    }

    if (firstArg === "update") {
      installCli();
      return;
    }

    if (firstArg === "uninstall") {
      uninstallCli();
      return;
    }

    if (firstArg === "check" && secondArg === "mr") {
      await runCheckMrCommand();
      return;
    }

    if (firstArg === "push") {
      await runPushCommand();
      return;
    }

    output.write(`${getUsageText()}\n`);
    process.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido ejecutando vet.";
    output.write(`${message}\n`);
    process.exitCode = 1;
  }
};

void run();
