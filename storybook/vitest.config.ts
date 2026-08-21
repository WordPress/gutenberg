import path from 'node:path';
import { configDefaults, defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

const configDir = import.meta.dirname;

export default defineConfig( {
	// The story globs in `main.ts` reach into `../packages`, so the Vite root
	// has to be the repository root for Vitest to match them.
	root: path.resolve( configDir, '..' ),
	plugins: [
		storybookTest( {
			configDir,
			storybookUrl: 'http://localhost:50240',
		} ),
	],
	test: {
		name: 'storybook',
		// The plugin excludes MDX relative to the working directory, which is
		// this workspace rather than the root. Exclude it everywhere.
		exclude: [ ...configDefaults.exclude, '**/*.mdx' ],
		browser: {
			enabled: true,
			headless: true,
			provider: playwright(),
			instances: [ { browser: 'chromium' } ],
		},
	},
} );
