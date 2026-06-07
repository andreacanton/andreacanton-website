---
name: update-packages
description: Update all project dependencies and create a PR for review. Use when the user wants to update/upgrade npm/pnpm packages, bump dependencies, or run the update-packages workflow.
model: haiku
---

# Update Packages

Updates all project dependencies and opens a PR for review. The mechanical,
deterministic work lives in a bundled bash script so the workflow is reliable
enough for a small model to drive.

## How it works

Run the subcommands of `scripts/update-packages.sh` (in this skill directory,
from the repo root) in order. The script prints clearly-prefixed status lines:

- `OK:` step succeeded — continue
- `STOP:` nothing to do — end cleanly (this is **not** an error)
- `FAIL:` needs attention — read the output, fix the problem, then re-run

## Steps

1. **Update** — `bash .claude/skills/update-packages/scripts/update-packages.sh update`
   - Switches to `main`, pulls, creates the `update-packages` branch, runs
     `pnpm update`, verifies with `pnpm build`, and commits the changes.
   - On `STOP:` (no dependency changes), stop here and report that everything is already up to date.
   - On `FAIL: pnpm build failed …`, investigate the build error, fix it, then re-run from step 1.

2. **Open PR** — `bash .claude/skills/update-packages/scripts/update-packages.sh pr`
   - Pushes the branch and opens a PR. Note the `PR_NUMBER=` line in the output.

3. **Merge** — `bash .claude/skills/update-packages/scripts/update-packages.sh merge <pr-number>`
   - Watches the PR checks. If they pass, it merges, switches back to `main`, pulls, and deletes the `update-packages` branch locally and remotely.
   - On `FAIL: … checks failed`, do **NOT** merge — report the failing checks.

On any other `FAIL:`, report the failure to the user and stop.
