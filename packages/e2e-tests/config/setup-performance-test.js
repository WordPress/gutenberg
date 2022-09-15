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

async function setupBrowser() {
	await clearLocalStorage();
	await setBrowserViewport( 'large' );
}

// Before every test suite run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
beforeAll( async () => {
	enablePageDialogAccept();

	await trashAllPosts();
	await trashAllPosts( 'wp_block' );
	await setupBrowser();
	await activatePlugin( 'gutenberg-test-plugin-disables-the-css-animations' );
} );

afterEach( async () => {
	await setupBrowser();
} );
