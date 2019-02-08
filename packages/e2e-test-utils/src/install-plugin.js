/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';

/**
 * Installs a plugin from the WP.org repository.
 *
 * @param {string} slug        Plugin slug.
 * @param {string?} searchTerm If the plugin is not findable by its slug use an alternative term to search.
 */
export async function installPlugin( slug, searchTerm ) {
	await switchUserToAdmin();
	await visitAdminPage( 'plugin-install.php', 's=' + encodeURIComponent( searchTerm || slug ) + '&tab=search&type=term' );
	await page.click( `.install-now[data-slug="${ slug }"]` );
	await page.waitForSelector( `.activate-now[data-slug="${ slug }"]` );
	await switchUserToTest();
}
