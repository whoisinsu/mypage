# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A personal homepage (plain HTML/CSS/JS, no framework or bundler) plus a passkey-protected private area.

- The public page is served from two places, both built from `main`:
  - GitHub Pages: https://whoisinsu.github.io/mypage/ (static only; the private area is hidden there)
  - Cloudflare Workers: same static files **and** the `/api/*` passkey server (D1 database)
- Private content never lives in the repo or in HTML. It is stored in D1 and returned only by `/api/private` after a passkey login.

## Structure

- `index.html` — public single page: `#about`, `#strengths`, `#timeline`, `#more`, `#scope`, then `#private-door` (entrance to the private area, shown only when `/api/session` answers)
- `private.html` + `js/private.js` — private area UI (login, sign-up, items, passkey list, request log). Contains no private data.
- `css/style.css` — all styling; theme colors are CSS variables in `:root`, overridden under `prefers-color-scheme: dark`
- `js/main.js` — public page behaviour
- `js/vendor/simplewebauthn-browser.umd.min.js` — vendored `@simplewebauthn/browser` (copy from `node_modules` when upgrading)
- `worker/index.js` — Cloudflare Worker: `/api/*` routes (register, login, logout, private items, credentials); everything else goes to static assets
- `migrations/` — D1 schema
- `scripts/e2e-test.mjs` — end-to-end test with a software authenticator; writes `evidence/e2e-<host>.md`
- `wrangler.jsonc` — Workers config; `.assetsignore` keeps server code, configs and docs out of the static assets

## Commands

```bash
npm ci
npm run db:migrate:local      # create local D1 tables
npm run dev                   # http://localhost:8787 (passkeys work on localhost)
npm test                      # e2e test against localhost (server must be running)
node scripts/e2e-test.mjs https://<deployed-url>
npm run db:migrate:remote     # apply schema to the Cloudflare D1 database
npm run deploy
```

## Conventions

- No frameworks or bundlers for the front end — keep it plain HTML/CSS/JS.
- New public sections go in `index.html` as `<section>` elements with matching nav links in `.site-header nav`.
- Add new colors as CSS variables (light + dark) instead of hardcoding.
- Anything new that should not be public as a static file must be listed in `.assetsignore`.
- Private data is always looked up by the session's user ID; never trust a username/owner from the URL or body.
- Content in the private area is fictional sample data — never put real personal information there.
