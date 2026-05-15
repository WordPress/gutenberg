/**
 * HMR / fast-refresh smoke test.
 *
 * Drives a headless Chromium against a running WordPress install and
 * verifies that:
 *   1. Editing a component source file updates the DOM without a full
 *      page reload.
 *   2. Introducing a syntax error shows the build-error overlay.
 *   3. Fixing the syntax error hides the overlay and HMR resumes.
 *
 * This test requires `npm run dev` to be running against a WordPress
 * install where the Gutenberg plugin is active. Configure URL/creds
 * via env vars:
 *
 *   WP_BASE_URL    default http://localhost:8888 (wp-env default)
 *   WP_USERNAME    default admin
 *   WP_PASSWORD    default password
 *
 * Usage:
 *
 *   npm run dev               # in another terminal
 *   npm run test:hmr
 */

/* eslint-disable no-console -- this is a CLI test runner; console is the UI. */

// eslint-disable-next-line import/no-extraneous-dependencies -- @playwright/test is a workspace dep via @wordpress/e2e-tests-playwright.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = resolve( __dirname, '..', '..' );

const BASE_URL = process.env.WP_BASE_URL ?? 'http://localhost:8888';
const USERNAME = process.env.WP_USERNAME ?? 'admin';
const PASSWORD = process.env.WP_PASSWORD ?? 'password';

const SOURCE_FILE = resolve(
	ROOT_DIR,
	'packages/edit-site/src/components/sidebar-navigation-screen-main/index.js'
);
const ERROR_FILE = resolve( ROOT_DIR, 'build/hmr/error.json' );
const SENTINEL_FILE = resolve( ROOT_DIR, 'build/hmr/.live' );

let failed = 0;
function assert( label, cond ) {
	if ( cond ) {
		console.log( `  ✓ ${ label }` );
	} else {
		console.log( `  ✗ ${ label }` );
		failed++;
	}
}

async function waitFor( fn, { timeout = 30_000, interval = 250 } = {} ) {
	const deadline = Date.now() + timeout;
	while ( Date.now() < deadline ) {
		if ( await fn() ) {
			return true;
		}
		await new Promise( ( r ) => setTimeout( r, interval ) );
	}
	return false;
}

async function main() {
	if ( ! existsSync( SENTINEL_FILE ) ) {
		console.error(
			'\nMissing build/hmr/.live sentinel — the live-reload SSE server\n' +
				"isn't running. Start `npm run dev` and try again.\n"
		);
		process.exit( 2 );
	}

	const original = readFileSync( SOURCE_FILE, 'utf8' );
	const labelMatch = original.match( /\{ __\( '([A-Za-z]+)' \) \}/ );
	if ( ! labelMatch ) {
		console.error(
			'Could not find a translatable string label to mutate in ' +
				SOURCE_FILE
		);
		process.exit( 2 );
	}
	const fromText = labelMatch[ 1 ];
	const editedText = `${ fromText }HMRTEST`;

	const browser = await chromium.launch( { headless: true } );
	const page = await browser.newContext().then( ( c ) => c.newPage() );

	const navigations = [];
	page.on( 'framenavigated', ( frame ) => {
		if ( frame === page.mainFrame() ) {
			navigations.push( frame.url() );
		}
	} );
	const consoleMessages = [];
	page.on( 'console', ( msg ) =>
		consoleMessages.push( `[${ msg.type() }] ${ msg.text() }` )
	);

	try {
		// --- Login ----------------------------------------------------------

		await page.goto( `${ BASE_URL }/wp-login.php` );
		await page.fill( '#user_login', USERNAME );
		await page.fill( '#user_pass', PASSWORD );
		await page.click( '#wp-submit' );
		await page.waitForLoadState( 'networkidle' ).catch( () => {} );

		await page.goto( `${ BASE_URL }/wp-admin/site-editor.php` );
		await page.waitForSelector(
			'.edit-site-sidebar-navigation-screen-main',
			{ timeout: 30_000 }
		);
		navigations.length = 0;

		// --- 1. HMR edit updates DOM ---------------------------------------

		console.log( '\nTest 1: HMR edit updates DOM without reload' );
		const t0 = Date.now();
		writeFileSync(
			SOURCE_FILE,
			original.replace(
				`{ __( '${ fromText }' ) }`,
				`{ __( '${ editedText }' ) }`
			)
		);
		await waitFor(
			async () => {
				const text = await page
					.locator( '.edit-site-sidebar-navigation-screen-main' )
					.innerText();
				return text.includes( editedText );
			},
			{ timeout: 30_000 }
		);
		const text = await page
			.locator( '.edit-site-sidebar-navigation-screen-main' )
			.innerText();
		assert( `DOM contains "${ editedText }"`, text.includes( editedText ) );
		assert( 'no full reloads', navigations.length === 0 );
		console.log( `  (took ${ Date.now() - t0 }ms)` );

		// --- 2. Build error → overlay --------------------------------------

		console.log( '\nTest 2: build error shows overlay' );
		writeFileSync(
			SOURCE_FILE,
			original.replace(
				'export function MainSidebarNavigationContent',
				'}} export function MainSidebarNavigationContent'
			)
		);
		await waitFor(
			async () =>
				await page.evaluate(
					() =>
						!! document.getElementById(
							'__hmr_build_error_overlay'
						)
				),
			{ timeout: 30_000 }
		);
		const overlayPresent = await page.evaluate(
			() => !! document.getElementById( '__hmr_build_error_overlay' )
		);
		assert( 'overlay present', overlayPresent );
		assert( 'error.json written', existsSync( ERROR_FILE ) );
		if ( overlayPresent ) {
			const overlayText = await page
				.locator( '#__hmr_build_error_overlay' )
				.innerText();
			assert(
				'overlay mentions package',
				overlayText.includes( 'edit-site' )
			);
			assert(
				'overlay mentions file path',
				overlayText.includes( 'sidebar-navigation-screen-main' )
			);
		}

		// --- 3. Fix error → overlay disappears, HMR resumes ----------------

		console.log( '\nTest 3: fix error → overlay clears, HMR resumes' );
		writeFileSync( SOURCE_FILE, original );
		await waitFor(
			async () =>
				! ( await page.evaluate(
					() =>
						!! document.getElementById(
							'__hmr_build_error_overlay'
						)
				) ),
			{ timeout: 20_000 }
		);
		const stillPresent = await page.evaluate(
			() => !! document.getElementById( '__hmr_build_error_overlay' )
		);
		assert( 'overlay gone', ! stillPresent );
		assert( 'error.json removed', ! existsSync( ERROR_FILE ) );

		const recoveryText = `${ fromText }RECOVERY`;
		writeFileSync(
			SOURCE_FILE,
			original.replace(
				`{ __( '${ fromText }' ) }`,
				`{ __( '${ recoveryText }' ) }`
			)
		);
		await waitFor(
			async () => {
				const t = await page
					.locator( '.edit-site-sidebar-navigation-screen-main' )
					.innerText();
				return t.includes( recoveryText );
			},
			{ timeout: 30_000 }
		);
		const finalText = await page
			.locator( '.edit-site-sidebar-navigation-screen-main' )
			.innerText();
		assert(
			`HMR works after recovery (DOM contains "${ recoveryText }")`,
			finalText.includes( recoveryText )
		);

		// --- 3.5 Edits that cascade-rebundle frontend-only outputs ---------
		//
		// Editing a file in @wordpress/block-library cascades to dependent
		// bundles, including block view scripts (modules/.../view.js) that
		// only load on the front-end, not in the admin. Without the
		// "skip not on this page" guard, every such cascade would trigger
		// a full reload for each missing script. Exercise that path here.

		console.log(
			'\nTest 3.5: cascade rebuilds with frontend-only outputs'
		);
		const blockLibraryFile = resolve(
			ROOT_DIR,
			'packages/block-library/src/navigation/edit/leaf-more-menu.js'
		);
		const blOriginal = readFileSync( blockLibraryFile, 'utf8' );
		const navsBefore = navigations.length;
		writeFileSync(
			blockLibraryFile,
			blOriginal.replace(
				'/**\n * WordPress dependencies\n */',
				'/**\n * WordPress dependencies\n * HMR-CASCADE-MARK\n */'
			)
		);
		// Allow time for the cascade rebuild + SSE batches.
		await waitFor(
			async () =>
				consoleMessages.some(
					( m ) =>
						m.includes( 'Not on this page, skipping:' ) &&
						m.includes( 'view.js' )
				),
			{ timeout: 60_000 }
		);
		const skippedFrontend = consoleMessages.some(
			( m ) =>
				m.includes( 'Not on this page, skipping:' ) &&
				m.includes( 'view.js' )
		);
		assert(
			'frontend-only view.js bundles were skipped (not full-reloaded)',
			skippedFrontend
		);
		assert(
			'no full reloads from cascade',
			navigations.length === navsBefore
		);
		writeFileSync( blockLibraryFile, blOriginal );

		// --- 4. Runtime-collision canary stays silent ----------------------
		//
		// If WP core's react-refresh-entry overwrote our DevTools hook
		// handlers, our runtime would log a clear warning ~5s after page
		// load. We loaded the page well over 5s ago, so by now the canary
		// has either fired (real bug) or stayed silent (healthy).

		console.log(
			'\nTest 4: runtime canary is silent (no WP core collision)'
		);
		const canaryFired = consoleMessages.some( ( m ) =>
			m.includes( 'tracking 0 React roots' )
		);
		assert( 'canary did not fire', ! canaryFired );

		// --- 5. SSE disconnect indicator -----------------------------------
		//
		// Kill whatever's listening on :35729 and confirm the badge appears
		// within a few seconds. Then leave it killed — the parent test
		// runner is responsible for restarting `npm run dev` if it cares.

		console.log(
			'\nTest 5: disconnect indicator appears after dev:live dies'
		);
		const beforeKillBadge = await page.evaluate(
			() => !! document.getElementById( '__hmr_disconnect_indicator' )
		);
		assert( 'no badge while connected', ! beforeKillBadge );

		const { execSync } = await import( 'node:child_process' );
		try {
			execSync( 'lsof -ti :35729 | xargs kill -9', { stdio: 'pipe' } );
		} catch {
			// Nothing listening on the port? Skip the kill.
		}
		await waitFor(
			async () =>
				await page.evaluate(
					() =>
						!! document.getElementById(
							'__hmr_disconnect_indicator'
						)
				),
			{ timeout: 8_000 }
		);
		const afterKillBadge = await page.evaluate(
			() => !! document.getElementById( '__hmr_disconnect_indicator' )
		);
		assert( 'badge appears within 8s of disconnect', afterKillBadge );

		console.log(
			`\n${
				failed === 0
					? 'OK'
					: `FAILED (${ failed } assertion${
							failed === 1 ? '' : 's'
					  })`
			} — full reloads observed: ${ navigations.length }`
		);
		console.log(
			'\nNote: this test killed the live-reload SSE server. ' +
				'Restart `npm run dev` to bring HMR back.'
		);
	} finally {
		writeFileSync( SOURCE_FILE, original );
		// Best-effort: also restore the cascade-test file if it got mutated.
		try {
			const blockLibraryFile = resolve(
				ROOT_DIR,
				'packages/block-library/src/navigation/edit/leaf-more-menu.js'
			);
			const current = readFileSync( blockLibraryFile, 'utf8' );
			if ( current.includes( 'HMR-CASCADE-MARK' ) ) {
				writeFileSync(
					blockLibraryFile,
					current.replace( /\n \* HMR-CASCADE-MARK\n/, '\n' )
				);
			}
		} catch {
			// ignore
		}
		await browser.close();
	}

	process.exit( failed === 0 ? 0 : 1 );
}

main().catch( ( err ) => {
	console.error( err );
	process.exit( 1 );
} );

/* eslint-enable no-console */
