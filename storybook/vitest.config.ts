import path from 'node:path';
import { configDefaults, defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

const configDir = import.meta.dirname;

export default defineConfig( {
	// `storybook/test` is served unbundled, and the optimizer only discovers
	// its CommonJS dependencies when they sit in the Vite root's
	// `node_modules`. Pre-bundle them from the package that owns them.
	optimizeDeps: { include: [ 'storybook > @testing-library/dom' ] },
	plugins: [
		storybookTest( {
			configDir,
			storybookUrl: 'http://localhost:50240',
		} ),
	],
	test: {
		name: 'storybook',
		// Those includes are repository-relative, so anchor the scan there
		// instead of following the Vite root, which `main.ts` may move.
		dir: path.resolve( configDir, '..' ),
		reporters: [
			'default',
			path.resolve( configDir, 'vitest-story-index-reporter.ts' ),
		],
		// The plugin excludes MDX relative to the working directory, which is
		// this workspace rather than the root. Exclude it everywhere.
		exclude: [ ...configDefaults.exclude, '**/*.mdx' ],
		// Runs a garbage collection before each file; see the setup file.
		setupFiles: [ path.resolve( configDir, 'vitest.setup.ts' ) ],
		browser: {
			enabled: true,
			headless: true,
			provider: playwright( {
				launchOptions: { args: [ '--js-flags=--expose-gc' ] },
			} ),
			instances: [ { browser: 'chromium' } ],
		},
	},
} );
