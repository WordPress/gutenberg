/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Regression coverage for https://github.com/WordPress/gutenberg/issues/78041.
 *
 * Firefox 150 (with the default `dom.multiple_import_maps.enabled = false`)
 * honors only the first `<script type="importmap">` that appears before a
 * module load or preload has started. If a third-party plugin emits an inline
 * `<script type="module">` in <head> before WordPress prints its import map
 * in the footer, every `@wordpress/*` bare-specifier import fails to resolve
 * and Gutenberg-rendered admin pages never boot.
 *
 * The fix hoists the WP import map into <head> on both `admin_print_scripts`
 * and `wp_print_scripts` at `PHP_INT_MIN` so it precedes any reasonable
 * third-party module emitter. This file exercises both the strong Firefox
 * repro (a real `import('@wordpress/boot')` issued from the early module
 * script) and a Chromium/WebKit baseline that asserts no regression on
 * engines that already support multiple import maps.
 *
 * The strong Firefox tests carry the `@firefox` Playwright tag so the
 * Playwright `firefox` project (configured in `test/e2e/playwright.config.ts`)
 * runs them and the `chromium` / `webkit` projects skip them. The baseline
 * blocks are untagged (Chromium) or tagged `@webkit` (Safari proxy) per the
 * same config.
 */

const AFFECTED_PAGES = [
	{
		label: 'Font Library',
		// Verified against lib/experimental/fonts/load.php.
		adminPath: 'admin.php',
		query: 'page=font-library-wp-admin',
	},
	{
		label: 'Connectors',
		// Verified against lib/experimental/connectors/load.php.
		adminPath: 'options-general.php',
		query: 'page=options-connectors-wp-admin',
	},
	{
		label: 'Post list — All',
		adminPath: 'edit.php',
		query: 'post_status=all',
	},
	{
		label: 'Post list — Draft',
		adminPath: 'edit.php',
		query: 'post_status=draft',
	},
	{
		label: 'Post list — Private',
		adminPath: 'edit.php',
		query: 'post_status=private',
	},
];

/**
 * Console messages that signal the bug we are guarding against. AC5 explicitly
 * lists these substrings; their absence is part of the no-regression contract.
 */
const FORBIDDEN_CONSOLE_PATTERNS = [
	/Import maps are not allowed/i,
	/was a bare specifier, but was not remapped/i,
];

function attachConsoleSink( page ) {
	const messages = [];
	page.on( 'console', ( msg ) => {
		messages.push( { type: msg.type(), text: msg.text() } );
	} );
	page.on( 'pageerror', ( err ) => {
		messages.push( { type: 'pageerror', text: String( err ) } );
	} );
	return messages;
}

function assertNoForbiddenConsole( messages ) {
	const offenders = messages.filter( ( m ) =>
		FORBIDDEN_CONSOLE_PATTERNS.some( ( re ) => re.test( m.text ) )
	);
	expect(
		offenders,
		`Console must not emit import-map-related errors. Saw:\n${ offenders
			.map( ( m ) => `[${ m.type }] ${ m.text }` )
			.join( '\n' ) }`
	).toEqual( [] );
}

test.describe( 'Import map ordering — Firefox single-importmap (@firefox)', () => {
	const PLUGIN_SLUG = 'gutenberg-test-early-module-script-bare-import';

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( PLUGIN_SLUG );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( PLUGIN_SLUG );
	} );

	for ( const { label, adminPath, query } of AFFECTED_PAGES ) {
		test( `${ label } boots with an earlier inline module script`, async ( {
			page,
			admin,
		} ) => {
			const consoleMessages = attachConsoleSink( page );

			await admin.visitAdminPage( adminPath, query );

			// The import map must be present in <head>. (It is hoisted by
			// gutenberg_print_import_map_early on admin_print_scripts /
			// wp_print_scripts at PHP_INT_MIN, so it comes ahead of the
			// fixture's `<script type="module">` at default priority 10.)
			await expect(
				page.locator( 'head script[type="importmap"]' )
			).toHaveCount( 1 );

			// The strong repro: the early module script issues a dynamic
			// `import('@wordpress/boot')`. On a pre-fix build under Firefox
			// 150 default config the import map is locked by the earlier
			// module load, the bare specifier fails to resolve, the global
			// settles to `false`, and this assertion fails. On a fixed
			// build it settles to `true`.
			await expect
				.poll(
					() =>
						page.evaluate(
							() => window.__importMapResolvedBareSpecifier
						),
					{
						message:
							'Early-fixture import("@wordpress/boot") must resolve once the WP import map is in <head>.',
						timeout: 15_000,
					}
				)
				.toBe( true );

			assertNoForbiddenConsole( consoleMessages );
		} );
	}
} );

test.describe( 'Import map ordering — Chromium baseline (no regression)', () => {
	// Untagged: the Playwright firefox project filters by `@firefox` and
	// the webkit project filters by `@webkit`, so this block runs under
	// the chromium project only. It validates AC5 (multi-importmap engines
	// unchanged).
	const PLUGIN_SLUG = 'gutenberg-test-early-module-script';

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( PLUGIN_SLUG );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( PLUGIN_SLUG );
	} );

	for ( const { label, adminPath, query } of AFFECTED_PAGES ) {
		test( `${ label } has no import-map console errors under Chromium`, async ( {
			page,
			admin,
		} ) => {
			const consoleMessages = attachConsoleSink( page );

			await admin.visitAdminPage( adminPath, query );

			await expect(
				page.locator( 'head script[type="importmap"]' )
			).toHaveCount( 1 );

			assertNoForbiddenConsole( consoleMessages );
		} );
	}
} );

test.describe( 'Import map ordering — WebKit baseline (@webkit)', () => {
	// Tagged @webkit: runs under the Playwright webkit project as the
	// Safari 18+ proxy for AC5.
	const PLUGIN_SLUG = 'gutenberg-test-early-module-script';

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( PLUGIN_SLUG );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( PLUGIN_SLUG );
	} );

	for ( const { label, adminPath, query } of AFFECTED_PAGES ) {
		test( `${ label } has no import-map console errors under WebKit`, async ( {
			page,
			admin,
		} ) => {
			const consoleMessages = attachConsoleSink( page );

			await admin.visitAdminPage( adminPath, query );

			await expect(
				page.locator( 'head script[type="importmap"]' )
			).toHaveCount( 1 );

			assertNoForbiddenConsole( consoleMessages );
		} );
	}
} );
