import {execFileSync} from "node:child_process";
import {mkdirSync, writeFileSync} from "node:fs";
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

const wrapperContent = `#!/usr/bin/env bash
REPO_DIR="${repoRoot}"
ENTRYPOINT="${cliEntrypointPath}"

if [ -d "$REPO_DIR/src" ]; then
  if [ ! -f "$ENTRYPOINT" ] || [ -n "$(find "$REPO_DIR/src" -type f -newer "$ENTRYPOINT" 2>/dev/null)" ]; then
    (cd "$REPO_DIR" && pnpm --silent build:cli >/dev/null 2>&1)
  fi
fi

exec node "$ENTRYPOINT" "$@"
`;

mkdirSync(wrapperDirectory, { recursive: true });
writeFileSync(wrapperPath, wrapperContent, {
  encoding: "utf-8",
  mode: 0o755,
});

process.stdout.write(`vet instalado en ${wrapperPath}\n`);
