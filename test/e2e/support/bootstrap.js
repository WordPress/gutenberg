/**
 * Node dependencies
 */
import { visitAdmin } from './utils';

const { PUPPETEER_TIMEOUT } = process.env;

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 100000 );

// After every test run, delete all content created by the test. This ensures
// other posts/comments/etc. aren't dirtying tests and tests don't depend on
// each other's side-effects.
//
// Right now we run the cleanup _after_ each test but we may want to do
// this in the `beforeAll` call instead, as mentioned here:
// https://github.com/WordPress/gutenberg/pull/8041#discussion_r203940770
//
// We can't do that while we rely on the global page object, but if we ditched
// the global approach we could use `visitAdmin` before
// `newDesktopBrowserPage()` is called.
afterAll( async () => {
	if ( ! global.page ) {
		return;
	}

	// This accepts a page dialog that may appear when navigating away from
	// Gutenberg to the admin, where we need to go to delete posts.
	page.on( 'dialog', ( dialog ) => {
		dialog.accept();
	} );

	// Visit `/wp-admin/edit.php` so we can see a list of posts and delete them.
	await visitAdmin( 'edit.php' );

	// If this selector doesn't exist there are no posts for us to delete.
	const bulkSelector = await page.$( '#bulk-action-selector-top' );
	if ( bulkSelector ) {
		// Select all posts.
		await page.waitForSelector( '#cb-select-all-1' );
		await page.click( '#cb-select-all-1' );
		// Select the "bulk actions" > "trash" option.
		await page.select( '#bulk-action-selector-top', 'trash' );
		// Submit the form to send all draft/scheduled/published posts to the trash.
		await page.click( '#doaction' );
		await page.waitForNavigation();
	}

	await browser.close();
} );
