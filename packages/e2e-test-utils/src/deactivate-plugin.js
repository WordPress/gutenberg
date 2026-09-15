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
	// Retry the click-and-wait sequence itself a couple of times: this
	// usually runs inside an `afterAll` hook, which doesn't benefit from
	// Jest's own `retryTimes()` safety net (that only re-runs `it()`
	// blocks, not hooks) — so under CI resource contention severe enough
	// that even the 60-second wait below times out, a single attempt has
	// no fallback and fails the whole suite teardown.
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
			// Puppeteer's own 30-second default for this wait is too tight
			// under CI resource contention; the admin page itself can take
			// longer than that to finish rendering after the deactivation
			// redirect, well before the plugin's own code runs.
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
