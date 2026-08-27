# Default Vitest Preset

Default [Vitest](https://vitest.dev/) configuration for WordPress projects.
It uses an ESM-only configuration, explicit Vitest imports, native
Vite/esbuild transforms, SWC React transforms with Emotion labels,
deterministic CSS mock class names outside Browser Mode, and
`@wordpress/vitest-console`.

## Installation

```bash
npm install --save-dev @wordpress/vitest-preset-default vite vitest
```

Create `vitest.config.js`:

```js
export { default } from '@wordpress/vitest-preset-default';
```

Vitest globals remain disabled. Import the APIs used by each test:

```js
import { expect, test, vi } from 'vitest';
```

## Test environments

The filename selects the environment:

-   Ordinary test names run in Node.js. This is the default.
-   `*.jsdom.test.*` files run in jsdom.
-   `*.browser.test.*` files run in Chromium with Vitest Browser Mode.

Node.js and jsdom tests use a deterministic stylesheet mock. Browser Mode
loads real CSS so tests can inspect computed styles and layout. Browser Mode
also preserves native browser APIs such as `matchMedia`. The Node.js and jsdom
projects set `WP_TESTS_SKIP_STYLE_INJECTION=true` so CSS already compiled into
a package by `wp-build` follows the same environment boundary.

The preset does not add browser behavior to jsdom. Use a local, restored mock
when a nonvisual test needs a browser signal as controlled input. Use Browser
Mode when the behavior depends on styles, layout, media queries, observers,
animation, or scrolling.

The preset does not run Babel. Vite and esbuild handle ordinary JavaScript,
TypeScript, and modules. `@vitejs/plugin-react-swc` handles React and applies
`@swc/plugin-emotion` with stable local labels.

For React tests, keep using Testing Library. Import
`@testing-library/jest-dom/vitest` from a setup file and register explicit
cleanup when globals are disabled:

```js
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach( cleanup );
```

To extend the preset, merge it with project-specific configuration:

```js
import wordpressConfig from '@wordpress/vitest-preset-default';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
	wordpressConfig,
	defineConfig( {
		test: {
			setupFiles: [ './test/setup.js' ],
		},
	} )
);
```

## Contributing

This package is part of the Gutenberg monorepo. See the
[contributor guide](https://github.com/WordPress/gutenberg/blob/HEAD/CONTRIBUTING.md).
