import react from '@vitejs/plugin-react-swc';
import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';
import { version as viteVersion } from 'vite';

const usesRolldown = Number( viteVersion.split( '.' )[ 0 ] ) >= 8;
// Compile browser dependencies against React's test runtime before tree shaking.
// A top-level define would make Vitest install a process global in the browser.
const browserDefine = { 'process.env.NODE_ENV': JSON.stringify( 'test' ) };

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
const setupTestFramework =
	'@wordpress/vitest-preset-default/setup-test-framework';
const styleMock = '@wordpress/vitest-preset-default/style-mock';
const styleMockAlias = {
	find: /^.*\.(?:css|scss)$/,
	replacement: styleMock,
};

export default defineConfig( {
	...( usesRolldown
		? { oxc: { jsx: { runtime: 'automatic' } } }
		: { esbuild: { jsx: 'automatic' } } ),
	plugins: [ react() ],
	test: {
		setupFiles: [ setupGlobals, setupTestFramework ],
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
				},
			},
			{
				extends: true,
				optimizeDeps: usesRolldown
					? {
							rolldownOptions: {
								transform: { define: browserDefine },
							},
					  }
					: { esbuildOptions: { define: browserDefine } },
				test: {
					name: 'browser',
					exclude,
					include: [ BROWSER_TEST_PATTERN ],
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
		isolate: true,
		clearMocks: false,
		mockReset: true,
		restoreMocks: true,
		unstubEnvs: true,
		unstubGlobals: true,
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
