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
	// Retry here, since this usually runs in an `afterAll` hook, which `retryTimes()` doesn't re-run.
	const maxAttempts = 3;
	for ( let attempt = 1; attempt <= maxAttempts; attempt++ ) {
		// A previous attempt may have actually deactivated the plugin
		// server-side and only timed out waiting for the row to
		// re-render, in which case the "Deactivate" link is already gone.
		const deactivateLink = await page.$(
			`tr[data-slug="${ slug }"] .deactivate a`
		);
		if ( deactivateLink ) {
			await page.click( `tr[data-slug="${ slug }"] .deactivate a` );
		}

		try {
			// Puppeteer's 30-second default is too short for this page under CI load.
			await page.waitForSelector( `tr[data-slug="${ slug }"] .delete a`, {
				timeout: 60000,
			} );
			break;
		} catch ( error ) {
			if ( attempt === maxAttempts ) {
				throw error;
			}
			await visitAdminPage( 'plugins.php' );
		}
	}
	await switchUserToTest();
}
