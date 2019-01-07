/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';

/**
 * Deactivates an active plugin.
 *
 * @param {string} slug Plugin slug.
 */
export async function deactivatePlugin( slug ) {
	await switchUserToAdmin();
	await visitAdminPage( 'plugins.php' );
	await page.click( `tr[data-slug="${ slug }"] .deactivate a` );
	await page.waitForSelector( `tr[data-slug="${ slug }"] .delete a` );
	await switchUserToTest();
}
