#!/usr/bin/env bash
#
# update-packages.sh — mechanical steps for the /update-packages workflow.
#
# Designed so a small model can drive the workflow by running subcommands and
# reacting to clearly-prefixed status lines:
#   OK:    step succeeded, continue
#   STOP:  nothing to do, end cleanly (not an error)
#   FAIL:  needs attention — read the output, fix, then re-run
#
# Subcommands:
#   update      checkout main, pull, branch, `pnpm update`, `pnpm build`, commit
#   major PKG   force-upgrade PKG past its semver range (`pnpm update --latest`),
#               `pnpm build`, commit as a separate change
#   abort       no updates were made on the branch — clean up and stop
#   pr          push the branch and open a PR; prints the PR number
#   merge N     watch checks for PR N, merge if green, then clean up branches
#
# Usage: .claude/scripts/update-packages.sh <update|major|abort|pr|merge> [arg]

set -euo pipefail

BRANCH="update-packages"
COMMIT_MSG="chore: Update packages"
PR_TITLE="Update packages"

die() { echo "FAIL: $*" >&2; exit 1; }

cmd_update() {
  command -v pnpm >/dev/null 2>&1 || die "pnpm is not installed"

  [ -z "$(git status --porcelain)" ] || die "working tree is dirty; commit or stash first"

  echo "OK: switching to main and pulling"
  git checkout main || die "could not switch to main"
  git pull --ff-only || die "git pull failed"

  # Reset any pre-existing branch so the run starts clean.
  if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
    echo "OK: recreating existing ${BRANCH} branch"
    git branch -D "${BRANCH}"
  fi
  git checkout -b "${BRANCH}" || die "could not create ${BRANCH} branch"

  echo "OK: running pnpm update"
  pnpm update || die "pnpm update failed"

  if [ -z "$(git status --porcelain package.json pnpm-lock.yaml)" ]; then
    echo "STOP: no in-range dependency changes — branch kept open to check for major-version upgrades next"
    exit 0
  fi

  echo "OK: running pnpm build to verify the update"
  pnpm build || die "pnpm build failed after the update — investigate and fix before re-running"

  echo "OK: committing dependency changes"
  git add package.json pnpm-lock.yaml
  git commit -m "${COMMIT_MSG}" || die "git commit failed"

  echo "OK: update complete — next check for major-version upgrades"
}

cmd_major() {
  command -v pnpm >/dev/null 2>&1 || die "pnpm is not installed"
  pkg="${1:-}"
  [ -n "${pkg}" ] || die "major requires a package name: major <package>"

  echo "OK: force-upgrading ${pkg} to its latest version (ignoring its semver range)"
  pnpm update "${pkg}" --latest || die "pnpm update --latest failed for ${pkg}"

  if [ -z "$(git status --porcelain package.json pnpm-lock.yaml)" ]; then
    echo "STOP: ${pkg} is already at its latest version — nothing to do"
    exit 0
  fi

  echo "OK: running pnpm build to verify the major upgrade of ${pkg}"
  pnpm build || die "pnpm build failed after upgrading ${pkg} — investigate and fix before re-running"

  echo "OK: committing major upgrade of ${pkg}"
  git add package.json pnpm-lock.yaml
  git commit -m "chore: Upgrade ${pkg} to latest major version" || die "git commit failed"

  echo "OK: major upgrade of ${pkg} complete"
}

cmd_abort() {
  [ "$(git branch --show-current)" = "${BRANCH}" ] || die "not on ${BRANCH} — nothing to abort"
  if [ -n "$(git log main.."${BRANCH}" --oneline)" ]; then
    die "refusing to abort — ${BRANCH} has commits ahead of main"
  fi

  echo "OK: no updates were made — cleaning up ${BRANCH}"
  git checkout main || die "could not switch to main"
  git branch -D "${BRANCH}"
  echo "STOP: nothing to update — all packages already up to date"
}

cmd_pr() {
  command -v gh >/dev/null 2>&1 || die "gh CLI is not installed"

  echo "OK: pushing ${BRANCH}"
  git push -u origin "${BRANCH}" || die "git push failed"

  echo "OK: creating PR"
  gh pr create --base main --head "${BRANCH}" \
    --title "${PR_TITLE}" \
    --body "Automated dependency update via the update-packages workflow, including any major-version upgrades Snyk identified as necessary to clear a vulnerability." \
    || die "gh pr create failed"

  pr_number="$(gh pr view "${BRANCH}" --json number --jq .number)" \
    || die "could not read PR number"
  echo "OK: PR created — #${pr_number}"
  echo "PR_NUMBER=${pr_number}"
  echo "OK: next run 'merge ${pr_number}'"
}

cmd_merge() {
  command -v gh >/dev/null 2>&1 || die "gh CLI is not installed"
  pr_number="${1:-}"
  [ -n "${pr_number}" ] || die "merge requires a PR number: merge <pr-number>"

  echo "OK: watching checks for PR #${pr_number}"
  if ! gh pr checks "${pr_number}" --watch; then
    die "PR #${pr_number} checks failed — do NOT merge; report the failures"
  fi

  echo "OK: checks passed — merging PR #${pr_number}"
  gh pr merge "${pr_number}" --merge || die "gh pr merge failed"

  echo "OK: cleaning up branches"
  git checkout main || die "could not switch to main"
  git pull --ff-only || die "git pull failed"
  git branch -D "${BRANCH}" 2>/dev/null || true
  git push origin --delete "${BRANCH}" 2>/dev/null || true

  echo "OK: done — PR #${pr_number} merged and branches cleaned up"
}

case "${1:-}" in
  update) cmd_update ;;
  major)  shift; cmd_major "$@" ;;
  abort)  cmd_abort ;;
  pr)     cmd_pr ;;
  merge)  shift; cmd_merge "$@" ;;
  *)      die "unknown subcommand '${1:-}' — use: update | major <package> | abort | pr | merge <pr-number>" ;;
esac
