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

Unit tests and their shared helpers use the public `@wordpress/eslint-plugin` `test-unit` configuration. The internal overrides in `config.mjs` preserve the previous baseline while [#83089](https://github.com/WordPress/gutenberg/issues/83089) separates the remaining work:

- `expect-expect` stays a warning until step 2 reviews assertion coverage. Exact assertion-helper names are configured only for their owning files. Existing compile-time-only tests retain their scoped inline exceptions.
- `no-conditional-expect` remains disabled for step 2. Some findings need test changes to ensure assertions cannot be skipped.
- `valid-describe-callback`, `valid-expect-in-promise`, and `valid-title` remain disabled for step 3. The inventory includes shared callback factories, `Promise.all` and returned assertions, and generated titles that need compatibility checks before enforcement changes.
- `no-alias-methods`, `no-done-callback`, and `no-test-prefixes` retain their previous error severity. The callback rule is deprecated by the Vitest plugin and mistakes the console setup's awaited `aroundEach` callback for a done callback. That file has a narrow exception; step 3 should reassess the rule alongside valid callback patterns.
- Vitest has no equivalent to `jest/no-export` or `jest/no-jasmine-globals`. The test-convention validator rejects exports from discovered suites while allowing shared helpers to export. ESLint's `no-restricted-globals` rejects the Jasmine globals, including in TypeScript files where `no-undef` is disabled.

The parser's shared helper keeps its stricter existing assertion, callback, promise, and title checks. The public baseline also enables Vitest-specific correctness rules and raises `no-commented-out-tests` from a warning to an error. Jest release deprecations no longer apply to unit tests. Legacy E2E retains its Jest 30 configuration through the public plugin. The public plugin still owns the Jest dependency; this workspace no longer imports it directly. jest-dom, Testing Library, Browser query allowances, and test discovery remain unchanged.

`npm run lint:js` runs `validate-test-config.mjs` first. These checks use the full repository config to verify Node, jsdom, Browser and shared-helper rules, representative valid and invalid code, narrow helper/type-only exceptions, and legacy E2E rules. Export restrictions have regression coverage in `test/unit/scripts/test/vitest-policy-rules.test.js`.

### Baseline inventory

On September 24, 2026, trunk `72e0cc4f894dde390838f64e588cc25b294c0fa3` had 1,188 discovered test files plus the parser's shared helper. Linting these 1,189 files with ESLint 10.10.0 and locked `@vitest/eslint-plugin` 1.6.27, using the full repository config, produced the following test-rule diagnostics. The trial replaced the Jest rules with the unmodified public Vitest baseline. Existing Jest inline directives did not suppress their Vitest equivalents.

| Rule                      | Existing Jest baseline | Unmodified Vitest baseline |
| ------------------------- | ---------------------: | -------------------------: |
| `expect-expect`           |            84 warnings |                 108 errors |
| `no-conditional-expect`   |                      0 |                  86 errors |
| `valid-title`             |                      0 |                  13 errors |
| `valid-expect-in-promise` |                      0 |                   6 errors |
| `valid-describe-callback` |                      0 |                   5 errors |
| `no-disabled-tests`       |             4 warnings |                 4 warnings |

These counts include valid helper and type-only patterns. They are an inventory for steps 2 and 3, not confirmed defects. No bulk suppression entries were added for the switch.
