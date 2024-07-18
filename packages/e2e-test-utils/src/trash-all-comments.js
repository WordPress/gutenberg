/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';

/**
 * Navigates to the comments listing screen and bulk-trashes any comments which exist.
 *
 * @return {Promise} Promise resolving once comments have been trashed.
 */
export async function trashAllComments() {
	await switchUserToAdmin();
	// Visit `/wp-admin/edit-comments.php` so we can see a list of comments and delete them.
	await visitAdminPage( 'edit-comments.php' );

	// If this selector doesn't exist there are no comments for us to delete.
	const bulkSelector = await page.$( '#bulk-action-selector-top' );
	if ( ! bulkSelector ) {
		return;
	}

	// Select all comments.
	await page.waitForSelector( '[id^=cb-select-all-]' );
	await page.click( '[id^=cb-select-all-]' );
	// Select the "bulk actions" > "trash" option.
	await page.select( '#bulk-action-selector-top', 'trash' );
	// Submit the form to send all mine/pendings/approved/spam comments to the trash.
	await page.click( '#doaction' );
	await page.waitForXPath(
		'//*[contains(@class, "notice")]/p[contains(text(), "moved to the Trash.")]'
	);
	await switchUserToTest();
}
