---
name: update-packages
description: Update all project dependencies and create a PR for review. Use when the user wants to update/upgrade npm/pnpm packages, bump dependencies, or run the update-packages workflow.
model: haiku
---

# Update Packages

Updates all project dependencies — including major-version bumps where Snyk
shows they're needed to clear a vulnerability — and opens a PR for review.
The mechanical, deterministic work lives in a bundled bash script so the
workflow is reliable enough for a small model to drive; the Snyk MCP tools
handle the part that needs judgment (deciding *which* packages need a major
upgrade).

## How it works

Run the subcommands of `scripts/update-packages.sh` (in this skill directory,
from the repo root) in order, and call the Snyk MCP tools where instructed.
The script prints clearly-prefixed status lines:

- `OK:` step succeeded — continue
- `STOP:` nothing to do — end cleanly (this is **not** an error)
- `FAIL:` needs attention — read the output, fix the problem, then re-run

## Steps

1. **Update in-range** — `bash .claude/skills/update-packages/scripts/update-packages.sh update`
   - Switches to `main`, pulls, creates the `update-packages` branch, runs
     `pnpm update` (which only moves packages within their current semver
     range), verifies with `pnpm build`, and commits the changes.
   - On `STOP:` (no in-range changes), the branch is kept open — continue to step 2 anyway, since a major-version upgrade may still be needed.
   - On `FAIL: pnpm build failed …`, investigate the build error, fix it, then re-run from step 1.

2. **Check whether any package needs a major-version upgrade** — call the
   `mcp__Snyk__snyk_sca_scan` MCP tool with `path` set to the absolute repo
   root (get it with `pwd`) and `dev: true`.
   - If the tool reports the folder isn't trusted, call `mcp__Snyk__snyk_trust` with the same path and re-run the scan.
   - For each reported vulnerability that has a fixed/upgrade version, compare that version's major version to the one currently installed (check `package.json` / `pnpm-lock.yaml`):
     - Same major version → `pnpm update` in step 1 already covers it (or will once available in-range) — ignore it.
     - Higher major version required to fix it → note the package name; it needs a forced major upgrade.
   - You can cross-check a specific package/version with `mcp__Snyk__snyk_package_health_check` (ecosystem `npm`) before committing to the upgrade, e.g. to confirm the new major isn't itself flagged as unmaintained.
   - No packages need a major bump → skip to step 4.

3. **Apply each major upgrade** — for every package identified in step 2, run:
   `bash .claude/skills/update-packages/scripts/update-packages.sh major <package-name>`
   - Force-upgrades that one package past its semver range (`pnpm update <package> --latest`), verifies with `pnpm build`, and commits it as its own change (so the PR diff stays easy to review per-package).
   - On `STOP:`, that package was already current — move on to the next one.
   - On `FAIL: pnpm build failed …`, investigate the break that specific major upgrade caused (it's usually a breaking-change migration), fix it, amend nothing — just fix the code, stage it, and re-run `major <package-name>` so the fix lands in the same commit.

4. **Nothing to do?** If neither step 1 nor step 3 produced any commits, run
   `bash .claude/skills/update-packages/scripts/update-packages.sh abort` to
   clean up the branch, then stop and report everything is already up to date.

5. **Open PR** — `bash .claude/skills/update-packages/scripts/update-packages.sh pr`
   - Pushes the branch and opens a PR. Note the `PR_NUMBER=` line in the output.

6. **Merge** — `bash .claude/skills/update-packages/scripts/update-packages.sh merge <pr-number>`
   - Watches the PR checks. If they pass, it merges, switches back to `main`, pulls, and deletes the `update-packages` branch locally and remotely.
   - On `FAIL: … checks failed`, do **NOT** merge — report the failing checks.

On any other `FAIL:`, report the failure to the user and stop.
