import react from '@vitejs/plugin-react-swc';
import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

const TEST_EXTENSIONS = '{js,jsx,ts,tsx,mjs,mts,cjs,cts}';
const DEFAULT_TEST_PATTERNS = [
	`**/__tests__/**/*.${ TEST_EXTENSIONS }`,
	`**/test/*.${ TEST_EXTENSIONS }`,
	`**/*.test.${ TEST_EXTENSIONS }`,
];
const JSDOM_TEST_PATTERN = `**/*.jsdom.test.${ TEST_EXTENSIONS }`;
const BROWSER_TEST_PATTERN = `**/*.browser.test.${ TEST_EXTENSIONS }`;
const exclude = [ ...configDefaults.exclude, '**/vendor/**' ];
const setupGlobals = '@wordpress/vitest-preset-default/setup-globals';
const setupBrowser = '@wordpress/vitest-preset-default/setup-browser';
const setupTestFramework =
	'@wordpress/vitest-preset-default/setup-test-framework';
const styleMock = '@wordpress/vitest-preset-default/style-mock';
const styleMockAlias = {
	find: /^.*\.(?:css|scss)$/,
	replacement: styleMock,
};

export default defineConfig( {
	esbuild: {
		jsx: 'automatic',
	},
	plugins: [
		react( {
			plugins: [
				[
					'@swc/plugin-emotion',
					{
						autoLabel: 'always',
						labelFormat: '[local]',
					},
				],
			],
		} ),
	],
	test: {
		projects: [
			{
				extends: true,
				resolve: {
					alias: [ styleMockAlias ],
				},
				test: {
					name: 'node',
					environment: 'node',
					exclude: [
						...exclude,
						JSDOM_TEST_PATTERN,
						BROWSER_TEST_PATTERN,
					],
					include: DEFAULT_TEST_PATTERNS,
					setupFiles: [ setupGlobals, setupTestFramework ],
				},
			},
			{
				extends: true,
				resolve: {
					alias: [ styleMockAlias ],
				},
				test: {
					name: 'jsdom',
					environment: 'jsdom',
					environmentOptions: {
						jsdom: {
							url: 'http://localhost/',
						},
					},
					exclude,
					include: [ JSDOM_TEST_PATTERN ],
					setupFiles: [ setupGlobals, setupTestFramework ],
				},
			},
			{
				extends: true,
				test: {
					name: 'browser',
					exclude,
					include: [ BROWSER_TEST_PATTERN ],
					setupFiles: [ setupBrowser, setupTestFramework ],
					browser: {
						enabled: true,
						headless: true,
						instances: [ { browser: 'chromium' } ],
						provider: playwright(),
					},
				},
			},
		],
		globals: false,
		includeTaskLocation: true,
		sequence: {
			hooks: 'list',
			setupFiles: 'list',
		},
		snapshotFormat: {
			escapeString: false,
			printBasicPrototype: false,
		},
	},
} );
