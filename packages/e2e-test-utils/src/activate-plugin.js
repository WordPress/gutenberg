/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';
import { isCurrentURL } from './is-current-url';

/**
 * Activates an installed plugin.
 *
 * @param {string} slug Plugin slug.
 */
export async function activatePlugin( slug ) {
	await switchUserToAdmin();
	await visitAdminPage( 'plugins.php' );
	const disableLink = await page.$(
		`tr[data-slug="${ slug }"] .deactivate a`
	);
	if ( disableLink ) {
		await switchUserToTest();
		return;
	}
	// Retry here, since this usually runs in a `beforeAll` hook, which `retryTimes()` doesn't re-run.
	const maxAttempts = 3;
	for ( let attempt = 1; attempt <= maxAttempts; attempt++ ) {
		// A previous attempt may have actually activated the plugin
		// server-side and only timed out waiting for the row to
		// re-render, in which case the "Activate" link is already gone.
		const activateLink = await page.$(
			`tr[data-slug="${ slug }"] .activate a`
		);
		if ( activateLink ) {
			await page.click( `tr[data-slug="${ slug }"] .activate a` );
		}

		if ( ! isCurrentURL( 'plugins.php' ) ) {
			await visitAdminPage( 'plugins.php' );
		}
		try {
			// Puppeteer's 30-second default is too short for this page under CI load.
			await page.waitForSelector(
				`tr[data-slug="${ slug }"] .deactivate a`,
				{ timeout: 60000 }
			);
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
