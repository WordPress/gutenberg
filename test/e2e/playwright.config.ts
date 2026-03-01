/**
 * External dependencies
 */
import os from 'os';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';

/**
 * WordPress dependencies
 */
import baseConfig from '@wordpress/scripts/config/playwright.config.js';

// The Playground runtime (WASM PHP) is ~3x slower than Docker.
// Scale up timeouts to avoid false negatives in CI.
const timeoutMultiplier = process.env.TIMEOUT_MULTIPLIER
	? Number( process.env.TIMEOUT_MULTIPLIER )
	: 1;

const isPlayground = timeoutMultiplier > 1;

// Tests that are known incompatible with the Playground WASM runtime.
// These rely on features unavailable in Playground (TinyMCE, cross-origin
// headers, specific locale configs, multi-instance collaboration, etc.).
const playgroundTestIgnore = isPlayground
	? [
			'**/specs/editor/blocks/classic.spec.js',
			'**/specs/editor/blocks/avatar.spec.js',
			'**/specs/editor/blocks/math.spec.js',
			'**/specs/editor/various/format-library/math.spec.js',
			'**/specs/editor/various/rtl.spec.js',
			'**/specs/editor/various/cross-origin-isolation.spec.js',
			'**/specs/editor/collaboration/**',
			'**/specs/widgets/customizing-widgets.spec.js',
			'**/specs/editor/blocks/fit-text.spec.js',
			'**/specs/admin/connectors.spec.js',
	  ]
	: [];

// Individual tests within mixed spec files that are known to fail on Playground.
// Uses grepInvert to skip by test title pattern, avoiding edits to test files.
const playgroundGrepInvert = isPlayground
	? new RegExp(
			[
				// Cover: image upload/focal-point processing too slow in WASM.
				'focal point picker',
				'not over the navigation block when the menu is open',
				// Taxonomies: SQLite data persistence after reload.
				'should be able to open the tags panel and create a new tag',
				"should be able to create a new tag with '",
				// Editor modes: code editor doesn't initialise in time.
				'should reparse changes from code editor',
				// Patterns: DOM detach / refresh timing.
				'Considers a pattern with whitespace an allowed pattern',
				'supports double-clicking the pattern to edit it',
				'can be inserted after refresh',
				// Inserting blocks: editor overlay intercepts pointer events.
				'inserts a default block on bottom padding click',
				// Writing flow: focus/tab order differs in Playground.
				'should not have a dead zone above an aligned block',
				'should only consider the content as one tab stop',
				// Dataviews: keyboard focus management differs.
				'Navigates the list via UP/DOWN arrow keys from action buttons',
				// Navigation overlay template part: frontend rendering.
				'create a navigation overlay for a specific navigation block',
				'add multiple close buttons',
				// Site editor patterns: pattern data not persisted.
				'sort patterns',
				// Template registration: creation UI timing.
				'user-customized templates cannot be overridden by plugins',
				// Templates: creation timing.
				'Create a custom template',
				// Block bindings: image element positioning.
				'should show the returned values in image attributes',
				'should be possible to edit the value of the text custom field from the image alt',
				// Navigation frontend: migration persistence.
				'Save post and verify migration was written to database',
				// Multi-block selection: pointer event interception in Playground.
				'should select with shift + click',
				'should partially select with shift + click',
				'should multi-select blocks without text selection',
				'should clear selection when clicking next to blocks',
				// Writing flow (webkit/firefox): focus/selection differs.
				'should extend selection into paragraph for list with longer last item',
				'should move to the start of the first line on ArrowUp',
			]
				.map( ( s ) => s.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) )
				.join( '|' )
	  )
	: undefined;

const config = defineConfig( {
	...baseConfig,
	testIgnore: [
		...( () => {
			if ( Array.isArray( baseConfig.testIgnore ) ) {
				return baseConfig.testIgnore;
			}
			if ( baseConfig.testIgnore ) {
				return [ baseConfig.testIgnore ];
			}
			return [];
		} )(),
		...playgroundTestIgnore,
	],
	timeout: ( baseConfig.timeout ?? 100_000 ) * timeoutMultiplier,
	expect: {
		...baseConfig.expect,
		timeout: ( baseConfig.expect?.timeout ?? 5_000 ) * timeoutMultiplier,
	},
	webServer: {
		...baseConfig.webServer,
		command: 'npm run wp-env-test -- start',
	},
	reporter: process.env.CI
		? [ [ 'github' ], [ './config/flaky-tests-reporter.ts' ] ]
		: 'list',
	workers: 1,
	globalSetup: fileURLToPath(
		new URL( './config/global-setup.ts', 'file:' + __filename ).href
	),
	use: {
		...baseConfig.use,
		actionTimeout:
			( baseConfig.use?.actionTimeout ?? 10_000 ) * timeoutMultiplier,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices[ 'Desktop Chrome' ] },
			grepInvert: playgroundGrepInvert
				? [ /-chromium/, playgroundGrepInvert ]
				: /-chromium/,
		},
		{
			name: 'webkit',
			use: {
				...devices[ 'Desktop Safari' ],
				/**
				 * Headless webkit won't receive dataTransfer with custom types in the
				 * drop event on Linux. The solution is to use `xvfb-run` to run the tests.
				 * ```sh
				 * xvfb-run npm run test:e2e
				 * ```
				 * See `.github/workflows/end2end-test-playwright.yml` for advanced usages.
				 */
				headless: os.type() !== 'Linux',
			},
			grep: /@webkit/,
			grepInvert: playgroundGrepInvert
				? [ /-webkit/, playgroundGrepInvert ]
				: /-webkit/,
		},
		{
			name: 'firefox',
			use: { ...devices[ 'Desktop Firefox' ] },
			grep: /@firefox/,
			grepInvert: playgroundGrepInvert
				? [ /-firefox/, playgroundGrepInvert ]
				: /-firefox/,
		},
	],
} );

export default config;
