/**
 * Internal dependencies
 */
import { switchUserToAdmin } from './switch-user-to-admin';
import { switchUserToTest } from './switch-user-to-test';
import { visitAdminPage } from './visit-admin-page';

/**
 * Uninstalls a plugin.
 *
 * @param {string} slug Plugin slug.
 */
export async function uninstallPlugin( slug ) {
	await switchUserToAdmin();
	await visitAdminPage( 'plugins.php' );
	const confirmPromise = new Promise( ( resolve ) => {
		page.once( 'dialog', () => resolve() );
	} );
	await Promise.all( [
		confirmPromise,
		page.click( `tr[data-slug="${ slug }"] .delete a` ),
	] );
	await page.waitForSelector( `tr[data-slug="${ slug }"].deleted` );
	await switchUserToTest();
}
