# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website and blog for Andrea Canton, built with Astro 5 and deployed on Netlify. Site URL: https://andreacanton.dev

## Commands

- **Dev server**: `pnpm dev`
- **Build** (includes type checking): `pnpm build` (runs `astro check && astro build`)
- **Preview production build**: `pnpm preview`
- **Format**: `pnpm exec prettier --write <file>`

## Architecture

- **Framework**: Astro 5 with MDX for blog posts, SCSS for styling (modern-compiler API), TypeScript
- **Package manager**: pnpm
- **Layout hierarchy**: `BaseLayout` (HTML shell, meta/OG tags) → `BlogLayout` (adds topbar + footer) → `PostLayout` (article wrapper with frontmatter rendering)
- **Pages**: File-based routing under `src/pages/`. Homepage (`index.astro`) is a standalone landing page using `BaseLayout` directly. Blog listing (`blog.astro`) globs all `posts/*.mdx` files.
- **Blog posts**: MDX files in `src/pages/posts/` with naming convention `YYYY-MM-DD-slug.mdx`. Drafts go in `src/pages/posts/draft/`. Posts use `PostLayout` via frontmatter `layout` field.
- **Frontmatter schema** (`src/interfaces/Frontmatter.ts`): `date` (required), `title` (required), `subtitle`, `description`, `tags`, `canonicalUrl`, `draft`, `lastUpdate`, `image`
- **Styles**: Single global SCSS file at `src/styles/main.scss`, plus scoped `<style lang="scss">` blocks in components/layouts
- **Config**: Trailing slashes enforced (`trailingSlash: 'always'`), inline stylesheets, passthrough image service, sitemap integration
