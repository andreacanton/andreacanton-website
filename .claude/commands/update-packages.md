Update all project dependencies and create a PR for review.

Steps:
1. Make sure you are on the `main` branch and it is up to date with `git pull`
2. Create a new branch named `update-packages` from main
3. Run `pnpm update` to update all dependencies
4. Run `pnpm build` to verify the build still works after the update
5. If the build fails, investigate and fix the issue before proceeding
6. Commit the changes to `pnpm-lock.yaml` and `package.json` (if modified) with the message `chore: Update packages`
7. Push the branch and create a PR with title "Update packages" targeting `main`
8. Wait for all PR checks to complete using `gh pr checks <pr-number> --watch`
9. If all checks pass, merge the PR with `gh pr merge <pr-number> --merge`, switch back to `main`, pull, and delete the `update-packages` branch locally and remotely
10. If checks fail, report the failures and do NOT merge
