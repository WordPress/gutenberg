# Move unit tests to Vitest

## Release boundary

The major releases `@wordpress/scripts` 36.0.0 and `@wordpress/eslint-plugin` 27.0.0 switch `test-unit-js`, the `test-unit` lint config, and the default `wp-scripts lint-js` unit-test rules to Vitest. These are intentional breaking changes.

`@wordpress/jest-preset-default` and `@wordpress/jest-console` are deprecated. Existing npm releases remain available. This guide stays in `@wordpress/scripts` after the deprecated package sources are removed. There will be no public WordPress Vitest preset or console package. Gutenberg's setup under `test/unit` is internal and is not a supported consumer import.

The existing `test-unit-jest` command and its dependencies remain supported for all of scripts 36.x. Removal will happen no earlier than scripts 37.0.0, after published-consumer verification. Consumers can migrate directly to Vitest now; they do not need to adopt the compatibility command as an intermediate step.

## Supported versions

| Tool                              | Supported range                        |
| --------------------------------- | -------------------------------------- |
| Node.js for `@wordpress/scripts`  | `^22.22.2` or `^24.15.0` or `>=26.0.0` |
| Vitest                            | `^5.0.0`                               |
| Vite                              | `^7.0.0` or `^8.0.0`                   |
| ESLint for the public lint config | `^9.0.0` or `^10.0.0`                  |

Vite 6 is not supported by this tooling release. The published `@wordpress/theme` dependency used by the lint tooling requires Vite 7 or 8.

Install Vitest and Vite as direct development dependencies in the consumer. They are optional peers of scripts so projects that only build or lint do not need a test runner. Keep any `@vitest/*` provider at the same version as Vitest. The examples use jsdom 26.1.0, Playwright 1.63.0, and React 18.3.1. No jsdom major upgrade is required for this migration.

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

Scripts users can replace `vitest run` with `wp-scripts test-unit-js`. The wrapper runs once by default, even in a terminal. `--watch` enables watching. Both forms use the same consumer configuration and installed runner.

No config is needed for plain JavaScript Node tests. Create `node.test.mjs`:

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

Vitest discovers `vitest.config.*` before `vite.config.*`. `--config` takes precedence over both. To reuse Vite plugins with a separate test config, use [`mergeConfig`](https://vitest.dev/config/). Babel and Jest transforms do not carry over. Rename JSX-bearing `.js` files to `.jsx`, and configure the React Vite plugin when testing React or Emotion source.

## Opt into jsdom

The following React example is a separate setup from the Node example. Use a `.jsx` extension for tests containing JSX.

```sh
npm install --save-dev jsdom@26.1.0 @vitejs/plugin-react-swc@4.3.3
npm install --save-dev react@18.3.1 react-dom@18.3.1 @testing-library/react@16.3.3 @testing-library/dom@10.4.1 @testing-library/jest-dom@7.0.1
```

Save the following as `vitest.config.mjs`:

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig( {
	plugins: [ react() ],
	test: {
		environment: 'jsdom',
		globals: false,
		restoreMocks: true,
		setupFiles: [ './setup.mjs' ],
	},
} );
```

Save this consumer setup as `setup.mjs`:

```js
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach( cleanup );
```

With globals disabled, register cleanup explicitly. Create `dom.test.jsx`:

```jsx
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

test( 'renders the Save button', () => {
	render( <button>Save</button> );
	expect(
		screen.getByRole( 'button', { name: 'Save' } )
	).toBeInTheDocument();
} );
```

Run `npm test -- dom.test.jsx` using the scripts above. Supply browser API mocks locally and restore them after each test. jsdom does not verify layout or CSS.

## Opt into Browser Mode

Use this as an alternative to the jsdom configuration. Create a separate consumer directory and first install Vitest/Vite and add the npm scripts from [Start with Node](#start-with-node), or replace `vitest.config.mjs` and run only the Browser example. Do not add the jsdom setup file to the Browser config.

```sh
npm install --save-dev @vitest/browser-playwright@5.0.0 playwright@1.63.0
npm install --save-dev @vitejs/plugin-react-swc@4.3.3 vitest-browser-react@2.3.0 react@18.3.1 react-dom@18.3.1
npm exec --no -- playwright install chromium
```

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig( {
	plugins: [ react() ],
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

Save that config as `vitest.config.mjs`. Create `browser.test.jsx`:

```jsx
import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import './button.css';

test( 'styles Save and calls its click handler', async () => {
	const onClick = vi.fn();
	const screen = await render(
		<button className="save-button" onClick={ onClick }>
			Save
		</button>
	);
	const button = screen.getByRole( 'button', { name: 'Save' } );

	await expect.element( button ).toHaveStyle( { paddingTop: '8px' } );
	await userEvent.click( button );
	expect( onClick ).toHaveBeenCalledTimes( 1 );
} );
```

Create `button.css` alongside the test:

```css
.save-button {
	padding: 8px;
}
```

Run `npm test -- browser.test.jsx`. Browser Mode loads real styles imported by the test graph, including this stylesheet. Await the `vitest-browser-react` renderer and actions from `vitest/browser`. The Browser assertion API is available without importing the jsdom setup or Gutenberg's helpers.

A `.jsdom.test.*` or `.browser.test.*` filename alone does not select an environment in public Vitest. Those suffixes are Gutenberg's internal policy. To mix environments, define separate Vitest projects with disjoint `include` patterns and the corresponding environment or browser configuration.

## Migrate Jest behavior explicitly

-   Import `describe`, `test`, `expect`, hooks, and `vi` from `vitest`. Replace Jest mocks using the [Jest migration guide](https://vitest.dev/guide/migration/jest). Mock factories, module reset behavior, and timers can differ.
-   Convert `testMatch` to `test.include`, `moduleNameMapper` to Vite aliases, and `setupFilesAfterEnv` to `test.setupFiles`. Choose the required cleanup options explicitly. Vitest's defaults do not reproduce the WordPress Jest preset.
-   Replace `@wordpress/jest-console` matchers with local `vi.spyOn( console, 'error' )` assertions and restore the spy. Unexpected console output does not fail a Vitest test by default. If your suite requires that contract, implement and test it in your own setup. Do not import Gutenberg's console setup.
-   Review snapshots when converting them. Keep runner-neutral `@testing-library/jest-dom` and snapshot-diff matchers where needed.
-   Use `--update` for snapshots and `--no-file-parallelism` for debugging. Jest options such as `--runInBand`, `--updateSnapshot`, and `--ci` are not interchangeable with Vitest options.
-   The public `test-unit` ESLint config uses `@vitest/eslint-plugin` recommended rules without declaring globals. Projects retaining Jest should install `eslint-plugin-jest` and select its `flat/recommended` config explicitly.

## Generated WordPress CSS

Rebuild packages with the published `@wordpress/build` before testing them. Generated CSS modules retain their class mappings in Node and jsdom, but do not inject styles when `NODE_ENV` is `test`. Generated ordinary CSS also skips injection. Browser Mode injects both forms because `process` is absent there. Do not define a browser `process` shim. Older generated output must be rebuilt to pick up the browser-safe guard.
