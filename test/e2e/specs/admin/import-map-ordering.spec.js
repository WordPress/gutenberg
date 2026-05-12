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
 * repro (a dynamic `import()` of the first specifier in the page's import
 * map, issued from an early `<script type="module">`) and a Chromium/WebKit
 * baseline that asserts no regression on engines that already support
 * multiple import maps.
 *
 * Playwright project routing: `test/e2e/playwright.config.ts` is shared
 * across the whole e2e suite, so per the implementer convention we use
 * per-test `test.skip( browserName === '...' )` calls instead of editing
 * the shared `grep` / `grepInvert` rules. The `@firefox`-tagged block runs
 * only under firefox; the Chromium baseline runs only under chromium; the
 * `@webkit`-tagged block runs only under webkit.
 */

const AFFECTED_PAGES = [
	{
		label: 'Font Library',
		// Verified against lib/experimental/fonts/load.php lines 19-26:
		// the page is registered under themes.php via add_submenu_page().
		adminPath: 'themes.php',
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

	// The Playwright firefox project carries `grep: /@firefox/` so this
	// block runs there; the chromium project has no grep filter and would
	// otherwise also run it. Skip explicitly so the strong-repro assertion
	// (which only proves the bug under Firefox 150 default config) is
	// scoped to firefox.
	// eslint-disable-next-line playwright/no-skipped-test
	test.skip(
		( { browserName } ) => browserName !== 'firefox',
		'@firefox-tagged regression assertion only exercises the bug under Firefox 150 default config.'
	);

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

			// The strong repro: the early module script introspects the
			// document's `<script type="importmap">` element, picks the
			// first bare specifier from `imports`, and dynamically imports
			// it. On a pre-fix build under Firefox 150 default config, the
			// WP map is emitted in the footer; the fixture's earlier
			// `<script type="module">` in <head> locks an empty/no-WP-keys
			// import map state, the dynamic import rejects with
			// `"... was a bare specifier, but was not remapped to anything"`,
			// the global settles to `false`, and this assertion fails.
			// On a fixed build the WP map is in <head> ahead of the
			// fixture, the import resolves, and the global settles to
			// `true`. Every Gutenberg-enhanced admin page covered by this
			// spec has at least `@wordpress/core-abilities` in its map
			// (enqueued globally by lib/client-assets.php on
			// `admin_enqueue_scripts`), so introspecting the first
			// specifier always finds at least one candidate.
			await expect
				.poll(
					() =>
						page.evaluate(
							() => window.__importMapResolvedBareSpecifier
						),
					{
						message:
							'Early-fixture dynamic import of the first import-map specifier must resolve once the WP import map is in <head>.',
						timeout: 15_000,
					}
				)
				.toBe( true );

			assertNoForbiddenConsole( consoleMessages );
		} );
	}
} );

test.describe( 'Import map ordering — Chromium baseline (no regression)', () => {
	// This block runs only under the chromium project to validate AC5
	// (multi-importmap engines unchanged). The firefox / webkit projects
	// have their own grep filters, but Chromium has no grep, so without
	// an explicit skip the firefox project would also pick this block up
	// when the runner is invoked broadly. Restrict to chromium with an
	// in-test conditional to avoid touching shared playwright.config.ts.
	const PLUGIN_SLUG = 'gutenberg-test-early-module-script';

	// eslint-disable-next-line playwright/no-skipped-test
	test.skip(
		( { browserName } ) => browserName !== 'chromium',
		'Chromium baseline asserts multi-importmap engines are unchanged.'
	);

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
	// Tagged @webkit: the webkit project runs only @webkit tests, but
	// the chromium project has no grep filter and would otherwise also
	// run this block. Restrict to webkit with an in-test conditional so
	// this is the Safari 18+ proxy for AC5.
	const PLUGIN_SLUG = 'gutenberg-test-early-module-script';

	// eslint-disable-next-line playwright/no-skipped-test
	test.skip(
		( { browserName } ) => browserName !== 'webkit',
		'@webkit-tagged block is the Safari 18+ proxy for AC5.'
	);

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
