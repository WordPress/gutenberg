/**
 * WordPress dependencies
 */
import {
	activateTheme,
	deactivatePlugin,
	enablePageDialogAccept,
	setBrowserViewport,
	switchUserToAdmin,
	switchUserToTest,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

async function setupBrowser() {
	//await clearLocalStorage();
	await setBrowserViewport( 'large' );
}

/**
 * Navigates to the post listing screen and bulk-trashes any posts which exist.
 *
 * @param {string} postType - String slug for type of post to trash.
 *
 * @return {Promise} Promise resolving once posts have been trashed.
 */
export async function trashExistingPosts( postType = 'post' ) {
	await switchUserToAdmin();
	// Visit `/wp-admin/edit.php` so we can see a list of posts and delete them.
	const query = addQueryArgs( '', {
		post_type: postType,
	} ).slice( 1 );
	await visitAdminPage( 'edit.php', query );

	// If this selector doesn't exist there are no posts for us to delete.
	const bulkSelector = await page.$( '#bulk-action-selector-top' );
	if ( ! bulkSelector ) {
		return;
	}

	// Select all posts.
	await page.click( '[id^=cb-select-all-]' );
	// Select the "bulk actions" > "trash" option.
	await page.select( '#bulk-action-selector-top', 'trash' );
	// Submit the form to send all draft/scheduled/published posts to the trash.
	await page.click( '#doaction' );
	await page.waitForSelector( 'text=/moved to the trash/i' );
	await switchUserToTest();
}

beforeAll( async () => {
	// Address Puppetteer vs Playwright API differences before running the tests
	page.$x = page.$$;
	page.select = page.selectOption;
	page.waitForXPath = page.waitForSelector;
	page.waitFor = page.waitForTimeout;
	page.cookies = () => page.context().cookies();

	// Initialize the environment
	await setupBrowser();
	await enablePageDialogAccept();
	await trashExistingPosts();
	await activateTheme( 'twentytwenty' );

	// Deactivate the plugin that disables the CSS animations in case it's enabled
	// (it is enabled for Puppeteer tests). We don't need to disable any
	// animations anymore thanks to Playwright's automatic element stability
	// check.
	await deactivatePlugin(
		'gutenberg-test-plugin-disables-the-css-animations'
	);
} );
