# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A static personal homepage — plain HTML/CSS/JS with no build step, package manager, or framework.

## Structure

- `index.html` — single-page site with `#about`, `#projects`, `#contact` sections
- `css/style.css` — styling, uses CSS custom properties for light/dark theming via `prefers-color-scheme`
- `js/main.js` — vanilla JS, loaded at the end of `<body>`
- `assets/` — images and other static files

## Running locally

There is no build tool. Open `index.html` directly in a browser, or serve the directory with any static file server (e.g. `npx serve .` or the VS Code Live Server extension) so relative paths resolve correctly.

## Conventions

- No frameworks or bundlers — keep it plain HTML/CSS/JS.
- New sections go in `index.html` as additional `<section>` elements with matching nav links in `.site-header nav`.
- Theme colors are defined once as CSS variables in `:root` and overridden under `prefers-color-scheme: dark` in `css/style.css` — add new colors as variables there rather than hardcoding.
