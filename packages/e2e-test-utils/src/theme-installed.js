/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { visitAdminPage } from './visit-admin-page';
import { switchUserToTest } from './switch-user-to-test';

/**
 * Checks whether a theme exists on the site.
 *
 * @param {string} slug Theme slug to check.
 * @return {boolean} Whether the theme exists.
 */
export async function themeInstalled( slug ) {
	await switchUserToAdmin();
	await visitAdminPage( 'themes.php' );
	const installed = ( await page.$( `[data-slug="${ slug }"]` ) ) !== null;
	await switchUserToTest();
	return installed;
}
