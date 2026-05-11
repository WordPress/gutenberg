# Phase 0 — Prompt

## Pipeline slug

`49843-wp-env-default-port-fallback`

## Linked GitHub issue

WordPress/gutenberg#49843 — "wp-env: consideration of active ports".

## Background

`@wordpress/env` (the wp-env CLI) starts a WordPress development environment in Docker on port `8888` (development) and `8889` (tests) by default. When either port is already in use on the host (a very common situation on machines that run other local dev stacks), the start command fails with a Docker port-binding error and the contributor has to either free the port or write a `.wp-env.json` with explicit port overrides before they can continue.

PR #74472 added an opt-in `--auto-port` CLI flag (and `"autoPort": true` config option) that scans for an available port when the configured one is busy. That PR landed as opt-in because an earlier "always on" version broke PHP unit tests and changed long-standing default behavior. CI determinism is preserved through a `process.env.CI` guard inside `load-config.js`.

The remaining gap is the out-of-the-box experience requested in #49843: a developer who has never configured `.wp-env.json` should be able to run `wp-env start` even when 8888 or 8889 are taken by another process, without learning about a flag.

## Goal of this pipeline

Allow `wp-env start` (and any other command that resolves ports) to fall back automatically to the next free port when the **default** ports 8888 (development) and 8889 (tests) are busy, without requiring `--auto-port`.

User-set ports — anything the contributor explicitly wrote in `.wp-env.json`, `.wp-env.override.json`, an environment variable override, or any other supported override mechanism — must NOT be silently replaced. They keep today's behavior: Docker (or the existing strict pre-flight) reports a "port busy" error so the contributor knows their explicit choice was honored.

The opt-in `--auto-port` flag and `"autoPort": true` config option must keep working for the case where contributors *want* their explicit ports to also auto-fall-back. Setting `"autoPort": false` explicitly must still force strict behavior on default ports too.

The `process.env.CI` determinism guard must keep applying — CI runs must not silently move ports around.

## Out of scope

- Phase 2 (Design doc) of the pipeline. RP does not implement it yet.
- MySQL port behavior (`mysqlPort`) — already supports Docker-native auto-assignment via `null`.
- Any change to the Docker layer, the WordPress runtime, or the public TypeScript types beyond what this feature needs.
- Renaming or deprecating `--auto-port` / `"autoPort"`.
- Cross-package refactors. Stay inside `packages/env/`.

## Acceptance criteria (high-level — refined in phase 1 spec)

1. With no `.wp-env.json` in the project (or one that does not set `port` / `testsPort`), running `wp-env start` while 8888 is occupied succeeds and binds the development environment to the next free port (8890, 8891, ...). Same for 8889 and the tests environment.
2. With `.wp-env.json` (or override / env var) explicitly setting `port: 9000`, running `wp-env start` while 9000 is occupied fails with the existing "port busy" message; it does NOT silently move to 9001.
3. With `--auto-port` (or `"autoPort": true`), explicit ports also auto-fall-back, matching today's behavior of PR #74472.
4. With `"autoPort": false` set explicitly, default ports do NOT auto-fall-back; a port-busy failure surfaces. (Hard opt-out for users who want determinism but not via `CI=1`.)
5. `CI=1` continues to disable all auto-fallback regardless of other settings.
6. Existing unit tests in `packages/env/lib/test/` and `packages/env/lib/config/test/` continue to pass; new tests cover the four behaviors above.
7. README and CHANGELOG updated to describe the new default behavior and the `"autoPort": false` opt-out.

## Anti-goals / things the pipeline should NOT do

- Do not introduce new top-level config options unless strictly necessary. Reuse `autoPort` as a tri-state (`undefined` / `true` / `false`) instead of inventing a second flag.
- Do not change `DEFAULT_ENVIRONMENT_CONFIG.port` or `testsPort` away from `8888` / `8889`.
- Do not break `appendPortToWPConfigs` or the `WP_HOME` / `WP_SITEURL` rewriting that depends on the resolved port.
- Do not silently print "moved port" messages with no way to suppress them; reuse the existing CLI spinner / informational message used by `--auto-port` today.

## Reference material

- Issue: https://github.com/WordPress/gutenberg/issues/49843
- Prior PR (opt-in `--auto-port`): https://github.com/WordPress/gutenberg/pull/74472
- Key source files:
  - `packages/env/lib/resolve-available-ports.js`
  - `packages/env/lib/config/load-config.js`
  - `packages/env/lib/config/post-process-config.js`
  - `packages/env/lib/config/parse-config.js`
  - `packages/env/lib/cli.js`
  - `packages/env/README.md`
  - `packages/env/CHANGELOG.md`

## Artifacts produced by this pipeline

Inside `.pipelines/49843-wp-env-default-port-fallback/`:

- `prompt.md` (this file)
- `spec.md` + `spec-review-N.md`
- `plan.md` + `plan-review-N.md`
- (No `design-doc.md` — phase 2 not implemented in RP yet.)
- `code-review-N.md` (implementation phase reviews; the implementation itself lands as code in `packages/env/`)
- `docs-review-N.md` (documentation phase reviews; doc changes land in README/CHANGELOG)

## Final deliverable

A draft GitHub PR against `WordPress/gutenberg` `trunk` from branch `try/49843-wp-env-default-port-fallback`, linking #49843, summarizing the change, and listing the acceptance criteria in its test plan.
