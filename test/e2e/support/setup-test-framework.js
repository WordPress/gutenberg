/**
 * External dependencies
 */
import 'expect-puppeteer';

/**
 * Internal dependencies
 */
import {
	clearLocalStorage,
	enablePageDialogAccept,
	setViewport,
	visitAdmin,
} from './utils';

/**
 * Environment variables
 */
const { PUPPETEER_TIMEOUT } = process.env;

/**
 * Array of page event tuples of [ eventName, handler ].
 *
 * @type {Array}
 */
const pageEvents = [];

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 100000 );

async function setupBrowser() {
	await clearLocalStorage();
	await setViewport( 'large' );
}

/**
 * Navigates to the post listing screen and bulk-trashes any posts which exist.
 *
 * @return {Promise} Promise resolving once posts have been trashed.
 */
async function trashExistingPosts() {
	// Visit `/wp-admin/edit.php` so we can see a list of posts and delete them.
	await visitAdmin( 'edit.php' );

	// If this selector doesn't exist there are no posts for us to delete.
	const bulkSelector = await page.$( '#bulk-action-selector-top' );
	if ( ! bulkSelector ) {
		return;
	}

	// Select all posts.
	await page.waitForSelector( '#cb-select-all-1' );
	await page.click( '#cb-select-all-1' );
	// Select the "bulk actions" > "trash" option.
	await page.select( '#bulk-action-selector-top', 'trash' );
	// Submit the form to send all draft/scheduled/published posts to the trash.
	await page.click( '#doaction' );
	return page.waitForXPath(
		'//*[contains(@class, "updated notice")]/p[contains(text(), "moved to the Trash.")]'
	);
}

/**
 * Adds an event listener to the page to handle additions of page event
 * handlers, to assure that they are removed at test teardown.
 */
function capturePageEventsForTearDown() {
	page.on( 'newListener', ( eventName, listener ) => {
		pageEvents.push( [ eventName, listener ] );
	} );
}

/**
 * Removes all bound page event handlers.
 */
function removePageEvents() {
	pageEvents.forEach( ( [ eventName, handler ] ) => {
		page.removeListener( eventName, handler );
	} );
}

// Before every test suite run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
beforeAll( async () => {
	capturePageEventsForTearDown();
	enablePageDialogAccept();

	await trashExistingPosts();
	await setupBrowser();
} );

afterEach( async () => {
	await setupBrowser();
} );

afterAll( () => {
	removePageEvents();
} );
