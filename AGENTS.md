# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

## Project Overview

Personal website and blog for Andrea Canton, a zero-dependency static site built with Bun 1.3.9 and deployed on Netlify. Site URL: https://andreacanton.dev

## Commands

- **Dev server**: `bun dev.ts` (or `bun run dev`)
- **Build**: `bun build.ts` (or `bun run build`), outputs to `dist/`
- **Test**: `bun test` (or `bun run test`), tests live in `test/`
- **Coverage**: `bun run test:coverage` writes `coverage/lcov.info`, which CI sends to SonarCloud
- **Format**: `bunx prettier --write <file>`

## Architecture

- **Runtime**: Bun 1.3.9, no npm dependencies and no `node_modules`
- **Build**: `build.ts` renders pages and blog posts into `dist/`; `dev.ts` serves and rebuilds during development; `highlight.ts` handles code highlighting
- **Templates**: HTML shells in `templates/` (`base`, `header`, `footer`, `blog`, `post`)
- **Pages**: static pages in `pages/` (`index.html`, `404.html`)
- **Blog posts**: Markdown files in `blog/` named `YYYY-MM-DD-slug.md`. Drafts go in `drafts/` and are never published.
- **Styles**: single global stylesheet `style.css`
- **Static assets**: `public/` is copied as-is into `dist/` (images, favicons, `_redirects`, etc.)
- **Deploy**: Netlify via `netlify.toml` (`bun build.ts`, publish `dist`, `BUN_VERSION` 1.3.9)

## Contribution

- never use folder when creating branches only a descriptive
  - NO: feat/add-button 
  - YES: add-button
  - NO: chore/upgrade-packages
  - yes: upgrade-packages