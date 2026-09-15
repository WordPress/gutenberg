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
	const deleteLink = await page.$( `tr[data-slug="${ slug }"] .delete a` );
	if ( deleteLink ) {
		await switchUserToTest();
		return;
	}
	await page.click( `tr[data-slug="${ slug }"] .deactivate a` );
	// Puppeteer's own 30-second default for this wait is too tight under CI
	// resource contention; the admin page itself can take longer than that
	// to finish rendering after the deactivation redirect, well before the
	// plugin's own code runs.
	await page.waitForSelector( `tr[data-slug="${ slug }"] .delete a`, {
		timeout: 60000,
	} );
	await switchUserToTest();
}
