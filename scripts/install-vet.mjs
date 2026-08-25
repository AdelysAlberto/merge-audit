import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const wrapperDirectory = path.join(os.homedir(), ".local", "bin");
const wrapperPath = path.join(wrapperDirectory, "vet");
const cliEntrypointPath = path.join(repoRoot, "dist-cli", "cli", "index.js");

execFileSync("pnpm", ["exec", "tsc", "-p", "tsconfig.cli.json"], {
  cwd: repoRoot,
  stdio: "inherit",
});

mkdirSync(wrapperDirectory, { recursive: true });
writeFileSync(wrapperPath, `#!/usr/bin/env bash\nnode "${cliEntrypointPath}" "$@"\n`, {
  encoding: "utf-8",
  mode: 0o755,
});

process.stdout.write(`vet instalado en ${wrapperPath}\n`);
