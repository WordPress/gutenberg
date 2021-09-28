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
export async function isThemeInstalled( slug ) {
	await switchUserToAdmin();
	await visitAdminPage( 'themes.php' );

	await page.waitForSelector( 'h2', { text: 'Add New Theme' } );
	const found = await page.$( `[data-slug="${ slug }"]` );

	await switchUserToTest();
	return Boolean( found );
}
