# Default Vitest Preset

[Vitest 5](https://vitest.dev/) configuration for WordPress projects, with explicit imports, isolated tests, React and Emotion compilation, and console matchers.

## Installation

Requires Node `^22.12.0 || ^24.0.0 || >=26.0.0`, npm `>=8.19.2`, Vitest 5 and Vite 7 or 8.

```bash
npm install --save-dev @wordpress/vitest-preset-default vitest@^5 vite@^8
```

Create `vitest.config.mjs`:

```js
export { default } from '@wordpress/vitest-preset-default';
```

Run `npm exec --no -- vitest run`. For Browser Mode, first install Chromium with `npm exec --no -- playwright install chromium`.

## Test environments

The filename selects the environment:

-   Ordinary test names run in Node, without a DOM. Tests in `test/`, `__tests__/`, and `*.test.*` files are discovered.
-   `*.jsdom.test.*` files run in jsdom.
-   `*.browser.test.*` files run in Chromium with Vitest Browser Mode.

The supported extensions are `js`, `jsx`, `ts`, `tsx`, `mjs`, `mts`, `cjs`, and `cts`. Dependencies and `vendor/` are excluded. Keep helper files outside discovered test paths.

Node and jsdom replace CSS and SCSS imports with a proxy. For example, `styles.primaryAction` returns `style-primary-action`. Browser Mode loads real CSS and preserves native APIs such as `matchMedia`, `ResizeObserver`, and `CSS.supports`.

Rebuilt packages using `@wordpress/build` also preserve this boundary. Its merged guard is `typeof process === 'undefined' || process.env.NODE_ENV !== 'test'`. Node and jsdom skip automatic style injection in test mode. Browser Mode injects styles because it does not define `process`. Ordinary CSS also checks for `document`. Do not add a `process` shim to Browser Mode. Older generated output must be rebuilt with a published build version containing [#82154](https://github.com/WordPress/gutenberg/pull/82154); the preset cannot repair old emitted code. Version `0.23.0` contains the fix.

The preset does not install browser mocks in jsdom. Use a local mock that the owning suite restores when browser signals are controlled test inputs. Use Browser Mode to test CSS, layout, geometry, observers, media queries, animation, or scrolling.

## Setup and compilation

Tests import APIs explicitly:

```js
import { expect, test, vi } from 'vitest';
```

Vite compiles JavaScript and TypeScript. SWC compiles JSX and applies the Emotion plugin with local labels. Browser dependencies compile with `NODE_ENV=test` without adding a `process` global. Babel configuration is not used. Use `.jsx` or `.tsx` for JSX.

The preset enables `SCRIPT_DEBUG` and supplies `tinyMCEPreInit` and `userSettings` in DOM environments. It installs [`@wordpress/vitest-console`](../vitest-console/README.md), resets mocks, restores spies and stubbed globals/environment variables, and restores real timers before each test. Test files remain isolated. Console assertions share per-test state, so tests that use them must not run concurrently within a file.

To extend the preset, merge project configuration:

```js
import wordpressConfig from '@wordpress/vitest-preset-default';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	wordpressConfig,
	defineConfig( {
		test: {
			setupFiles: [ './test-setup.js' ],
		},
	} )
);
```

Setup applies to all projects. Keep environment-specific setup in the corresponding project's `test.setupFiles`. For jsdom React tests, use Testing Library React and register cleanup explicitly because globals are disabled:

```js
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach( cleanup );
```

For Browser React tests, use `vitest-browser-react` and Browser Mode's `userEvent`. The browser renderer handles cleanup. Tests can use Vitest's native DOM assertions.

## Migrating from Jest

Install the new packages and add the configuration above. Rename DOM tests to `*.jsdom.test.*` and tests that need browser behavior to `*.browser.test.*`. Replace Jest globals with explicit Vitest imports and review mock hoisting, timers, snapshots, and asynchronous assertions against the [Vitest migration guide](https://vitest.dev/guide/migration/). Await asynchronous assertions, including `expect.poll` and `.resolves`.

This release is additive. `@wordpress/jest-preset-default`, `@wordpress/jest-console`, existing Jest ESLint defaults, and `wp-scripts test-unit-js` remain available. Run Vitest directly to opt in. This package does not change lint defaults or switch existing commands.

## Release verification

Before public tooling adopts these packages, publish and verify `@wordpress/vitest-console`, then `@wordpress/vitest-preset-default`. Verify the actual registry artifacts in isolated consumers. Also confirm that a published `@wordpress/build` contains #82154 and rebuild affected CSS-module and regular-CSS output. The source fix is merged; no further build-fix PR is required. Publishing these packages does not require switching `wp-scripts` or removing Jest.

In this repository, `npm run --workspace @wordpress/unit-tests test:unit:vitest:packages` packs the packages and tests an isolated consumer. Set `VITEST_CONSUMER_JEST=1` to also verify the unchanged packed Jest tooling on its supported Node versions. Set `VITEST_CONSUMER_VITE` to an exact supported Vite version and run under each supported Node major. The validator checks generated CSS, public types, console matchers, setup configuration, failure output, and browser values. It does not publish packages.

Vitest 5.0.0's `vitest/config` declaration entry still imports the undeclared `@vitest/expect` package. Use the `.mjs` configuration above until that upstream declaration issue is fixed. This preset's public declarations use `vite` and `vitest/node`; its matcher types compile without that retired package.

## Contributing

See the [contributor guide](https://github.com/WordPress/gutenberg/blob/HEAD/CONTRIBUTING.md).

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
