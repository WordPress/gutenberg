/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	clearLocalStorage,
	enablePageDialogAccept,
	setBrowserViewport,
	trashAllPosts,
} from '@wordpress/e2e-test-utils';

/**
 * Timeout, in seconds, that the test should be allowed to run.
 *
 * @type {string|undefined}
 */
const PUPPETEER_TIMEOUT = process.env.PUPPETEER_TIMEOUT;

// The Jest timeout is increased because these tests are a bit slow.
jest.setTimeout( PUPPETEER_TIMEOUT || 100000 );

async function setupPage() {
	await setBrowserViewport( 'large' );
	await page.emulateMediaFeatures( [
		{ name: 'prefers-reduced-motion', value: 'reduce' },
	] );
}

// Before every test suite run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
beforeAll( async () => {
	enablePageDialogAccept();

	await trashAllPosts();
	await trashAllPosts( 'wp_block' );
	await clearLocalStorage();
	await setupPage();
	await activatePlugin( 'gutenberg-test-plugin-disables-the-css-animations' );
} );

afterEach( async () => {
	// Clear localStorage between tests so that the next test starts clean.
	await clearLocalStorage();
	// Close the previous page entirely and create a new page, so that the next test
	// isn't affected by page unload work.
	await page.close();
	page = await browser.newPage();
	// Set up testing config on new page.
	await setupPage();
} );
