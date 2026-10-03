# @wordpress/eslint-tools

Consolidated ESLint configuration for the Gutenberg monorepo. This is a **private** workspace package and is not published to npm.

## Files

-   **`config.mjs`** — Main ESLint flat config. The root `eslint.config.mjs` re-exports this so that ESLint, VS Code, and CI all resolve it transparently.
-   **`import-resolver.cjs`** — Custom import resolver that maps `@wordpress/*` package imports to source files (`src/`) instead of built files (`build-module/`), so linting works without a build step.
-   **`lint-js.cjs`** — Wrapper around `wp-scripts lint-js` used by `npm run lint:js`. Streams ESLint output through, detects the "stale suppressions" hint, and formats `suppressions.json` after `--prune-suppressions` runs.
-   **`suppressions.json`** — ESLint suppressions file for pre-existing violations. Updated via `npm run lint:js:prune-suppressions`. CI enforces that this file is pruned and committed.

## Why a workspace package?

Moving all ESLint plugins and config into a single package keeps the root `package.json` clean and makes future ESLint upgrades easier — all plugin dependencies live in one place rather than being scattered across root `devDependencies`.

## Unit-test lint baseline

Unit tests and shared helpers use the public `@wordpress/eslint-plugin` `test-unit` configuration. Internal overrides and their reasons are documented in `config.mjs`; [#83089](https://github.com/WordPress/gutenberg/issues/83089) tracks the remaining rule decisions.

`npm run lint:js` first runs `validate-test-config.mjs` to check the Node, jsdom, Browser, shared-helper and legacy E2E configurations, including repository-specific exceptions.
