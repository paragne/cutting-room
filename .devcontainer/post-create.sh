#!/usr/bin/env bash
# Runs once when the container is created. Installs only into gitignored or
# user-scope paths; never writes tracked files.
set -euo pipefail
cd "$(dirname "$0")/.."

# Docker creates the config volume and the parent dirs of the nested bind
# mounts as root. Hand the directory (not the read-only mounts) to node.
sudo chown node:node /home/node/.claude
[ -e /home/node/.claude/settings.json ] && sudo chown node:node /home/node/.claude/settings.json

# Git identity, written on the host by initializeCommand (gitignored file).
if [ -s .devcontainer/.git-identity ]; then
  git config --global user.name "$(sed -n 1p .devcontainer/.git-identity)"
  git config --global user.email "$(sed -n 2p .devcontainer/.git-identity)"
else
  echo "WARNING: no .devcontainer/.git-identity; set git user.name and user.email on the host"
fi

IMPECCABLE_VERSION="4.1.0"
SKILLS_CLI_VERSION="1.7.1"

# Taste Skill, user scope (the claude-code-config volume).
npx --yes "skills@${SKILLS_CLI_VERSION}" add https://github.com/Leonxlnx/taste-skill \
  --skill design-taste-frontend --global --agent claude-code --yes

# Impeccable, project scope, UI repos only. The detector hook needs project
# scope. The marker is the gitignore block new-repo.sh --ui writes. The repo
# is bind-mounted, so this only runs on a fresh clone; rebuilds keep the install.
if grep -q "impeccable-ignore-start" .gitignore 2>/dev/null; then
  if [ -d .claude/skills/impeccable ]; then
    echo "impeccable: already installed in project"
  else
    npx --yes "impeccable@${IMPECCABLE_VERSION}" install --providers=claude --scope=project </dev/null \
      || echo "WARNING: impeccable install failed or wanted input. Run in the container: npx impeccable@${IMPECCABLE_VERSION} install --providers=claude --scope=project"
  fi
fi

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