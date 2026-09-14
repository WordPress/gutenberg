# Move unit tests to Vitest

## Release boundary

The next major releases, `@wordpress/scripts` 36.0.0 and
`@wordpress/eslint-plugin` 27.0.0, switch `test-unit-js`, the `test-unit` lint
config, and the default `wp-scripts lint-js` unit-test rules to Vitest.
These are intentional breaking changes. Package versions are assigned by the
normal release process from the Breaking Changes changelog entries.

`@wordpress/jest-preset-default` and `@wordpress/jest-console` are deprecated.
There will be no public WordPress Vitest preset or console package. Gutenberg's
setup under `test/unit` is internal and is not a supported consumer import.

The existing `test-unit-jest` command and its dependencies remain supported for
all of scripts 36.x. Remove them no earlier than scripts 37.0.0, after the
release gate below passes. Consumers can migrate directly to Vitest now; they
do not need to adopt the compatibility command as an intermediate step.

## Supported versions

| Tool                              | Supported range                        |
| --------------------------------- | -------------------------------------- |
| Node.js for `@wordpress/scripts`  | `^22.22.2` or `^24.15.0` or `>=26.0.0` |
| Vitest                            | `^5.0.0`                               |
| Vite                              | `^6.4.0` or `^7.0.0` or `^8.0.0`       |
| ESLint for the public lint config | `^9.0.0` or `^10.0.0`                  |

Install Vitest and Vite as direct development dependencies in the consumer.
They are optional peers of scripts so projects that only build or lint do not
need a test runner. Keep any `@vitest/*` provider at the same version as Vitest.
The examples use jsdom 26.1.0, Playwright 1.63.0, and React 18.3.1.
No jsdom major upgrade is required for this migration.

## Start with Node

```sh
npm install --save-dev vitest@^5 vite@^8
```

```json
{
	"scripts": {
		"test": "vitest run",
		"test:watch": "vitest --watch",
		"test:debug": "vitest --inspect-brk --no-file-parallelism --watch=false",
		"test:update": "vitest run --update"
	}
}
```

Scripts users can replace `vitest run` with `wp-scripts test-unit-js`. The
wrapper runs once by default, even in a terminal. `--watch` enables watching.
Both forms use the same consumer configuration and installed runner.

No config is needed for plain JavaScript Node tests:

```js
import { expect, test } from 'vitest';

test( 'adds two numbers', () => {
	expect( 1 + 2 ).toBe( 3 );
} );
```

For explicit configuration, create `vitest.config.mjs`:

```js
import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		environment: 'node',
		globals: false,
		restoreMocks: true,
	},
} );
```

Vitest discovers `vitest.config.*` before `vite.config.*`. `--config` takes
precedence over both. To reuse Vite plugins with a separate test config, use
[`mergeConfig`](https://vitest.dev/config/). Babel and Jest transforms do not
carry over. Rename JSX-bearing `.js` files to `.jsx`, and configure the React
Vite plugin when testing React or Emotion source.

## Opt into jsdom

```sh
npm install --save-dev jsdom@26.1.0 @vitejs/plugin-react-swc@^4
```

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig( {
	plugins: [ react() ],
	test: {
		environment: 'jsdom',
		globals: false,
		restoreMocks: true,
	},
} );
```

For React rendering, install `@testing-library/react` and its `@testing-library/dom` peer, then use `render`.
For DOM matchers, install `@testing-library/jest-dom`, import
`@testing-library/jest-dom/vitest` from a consumer setup file, and add that file
to `test.setupFiles`. With globals disabled, register Testing Library's
`cleanup` with an imported Vitest `afterEach`. Supply any browser API mocks
locally and restore them after each test. jsdom does not verify layout or CSS.

## Opt into Browser Mode

```sh
npm install --save-dev @vitest/browser-playwright@5.0.0 playwright@1.63.0
npm exec --no -- playwright install chromium
```

```js
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig( {
	test: {
		globals: false,
		browser: {
			enabled: true,
			headless: true,
			provider: playwright(),
			instances: [ { browser: 'chromium' } ],
		},
	},
} );
```

Browser Mode loads real styles. Import `userEvent` from `vitest/browser` for
browser interaction. For React tests, add the React plugin above and use
`vitest-browser-react`. Install it alongside matching React and React DOM.

A `.jsdom.test.*` or `.browser.test.*` filename alone does not select an
environment in public Vitest. Those suffixes are Gutenberg's internal policy.
To mix environments, define separate Vitest projects with disjoint `include`
patterns and the corresponding environment or browser configuration.

## Migrate Jest behavior explicitly

-   Import `describe`, `test`, `expect`, hooks, and `vi` from `vitest`. Replace Jest
    mocks using the [Jest migration guide](https://vitest.dev/guide/migration/jest).
    Mock factories, module reset behavior, and timers can differ.
-   Convert `testMatch` to `test.include`, `moduleNameMapper` to Vite aliases, and
    `setupFilesAfterEnv` to `test.setupFiles`. Choose the required cleanup options
    explicitly. Vitest's defaults do not reproduce the WordPress Jest preset.
-   Replace `@wordpress/jest-console` matchers with local `vi.spyOn( console,
'error' )` assertions and restore the spy. Unexpected console output does not
    fail a Vitest test by default. If your suite requires that contract, implement
    and test it in your own setup. Do not import Gutenberg's console setup.
-   Review snapshots when converting them. Keep runner-neutral
    `@testing-library/jest-dom` and snapshot-diff matchers where needed.
-   Use `--update` for snapshots and `--no-file-parallelism` for debugging.
    Jest options such as `--runInBand`, `--updateSnapshot`, and `--ci` are not
    interchangeable with Vitest options.
-   The public `test-unit` ESLint config uses `@vitest/eslint-plugin` recommended
    rules without declaring globals. Projects retaining Jest should install
    `eslint-plugin-jest` and select its `flat/recommended` config explicitly.

## Generated WordPress CSS

Rebuild packages with the published `@wordpress/build` before testing them.
Generated CSS modules retain their class mappings in Node and jsdom, but do
not inject styles when `NODE_ENV` is `test`. Generated ordinary CSS also skips
injection. Browser Mode injects both forms because `process` is absent there.
Do not define a browser `process` shim or restore `WP_TESTS_SKIP_STYLE_INJECTION`.
Older generated output must be rebuilt to pick up the browser-safe guard.

The isolated fixture checks both forms, duplicate imports, generated class
mappings, and token fallbacks using the published `@wordpress/build` package. It does not mock
style injection or import Gutenberg's test setup.

## Verification and release gate

Run `npm run test:unit:consumers` from Gutenberg to pack the changed public
packages, install them outside the workspace, and run the documented configs.
Use `--vite=<version>` to select a supported Vite version and `--browser` to
include Chromium. `--node=/absolute/path/to/node` selects a consumer runtime.
The check reports the actual Node, Vite, Vitest, and build versions. To replay
a recorded dependency resolution, pass `--lockfile=/path/to/package-lock.json`
from an earlier consumer run. The changed packages are still repacked and installed.

Before final Jest retirement:

1. Publish scripts 36 and eslint-plugin 27 through the existing protected
   WordPress packages release workflow. Publish the Jest package deprecation
   notices and apply npm deprecation messages through the release process.
2. Run the isolated checks with `--scripts=<published-version>` and
   `--eslint-plugin=<published-version>` against the registry releases.
   Record the published versions and the Node/Vite results in the release PR.
3. Verify Node, jsdom, Browser Mode, generated CSS, config discovery, linting,
   and default/watch/debug/update commands. Preserve the Node 24/26 repository
   matrix, single Chromium job, timezone checks, and Storybook smoke coverage.
4. Only then remove internal Jest infrastructure. Public `test-unit-jest` and
   its dependencies cannot be removed before scripts 37.0.0.

Packed-source checks before publication do not satisfy the release gate.
