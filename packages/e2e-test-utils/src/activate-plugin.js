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
	await page.click( `tr[data-slug="${ slug }"] .activate a` );

	if ( ! isCurrentURL( 'plugins.php' ) ) {
		await visitAdminPage( 'plugins.php' );
	}
	await page.waitForSelector( `tr[data-slug="${ slug }"] .deactivate a` );
	await switchUserToTest();
}
