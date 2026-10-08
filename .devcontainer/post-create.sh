#!/usr/bin/env bash
# Runs once when the container is created. Nothing here writes to the repo.
set -euo pipefail

# Design skills, user scope (the claude-code-config volume).
npx --yes impeccable@4.1.0 install --providers=claude --scope=global --no-hooks
npx --yes skills@1.7.1 add https://github.com/Leonxlnx/taste-skill \
  --skill design-taste-frontend --global --agent claude-code --yes

# Copy the hooks block from the host's settings.json into the container's,
# rewriting host home paths to the container home. Other settings untouched.
node - <<'JS'
const fs = require("fs");
const src = "/home/node/.claude-host/settings.json";
const dst = "/home/node/.claude/settings.json";
const hostHome = process.env.HOST_HOME;
if (!hostHome) throw new Error("HOST_HOME not set");
const host = JSON.parse(fs.readFileSync(src, "utf8"));
if (!host.hooks) { console.log("host settings.json has no hooks; skipping"); process.exit(0); }
const hooks = JSON.parse(JSON.stringify(host.hooks).split(hostHome).join(process.env.HOME));
const cur = fs.existsSync(dst) ? JSON.parse(fs.readFileSync(dst, "utf8")) : {};
cur.hooks = hooks;
fs.writeFileSync(dst, JSON.stringify(cur, null, 2) + "\n");
console.log("hooks synced into", dst);
JS

command -v python3 >/dev/null || echo "WARNING: python3 missing; slop-check hook will fail"
