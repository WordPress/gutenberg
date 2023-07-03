/**
 * Internal dependencies
 */
import { createURL } from './create-url';
import { isCurrentURL } from './is-current-url';

/**
 * Performs log out.
 *
 */
export async function logout() {
	// If it is logged and in a page different than the dashboard,
	// move to the dashboard. Some pages may be in full-screen mode,
	// so they won't have the log-out button available.
	if ( ! isCurrentURL( 'wp-login.php' ) && ! isCurrentURL( 'wp-admin' ) ) {
		await page.goto( createURL( 'wp-admin' ) );
	}

	await Promise.all( [
		page.hover( '#wp-admin-bar-my-account' ),
		page.waitForSelector( '#wp-admin-bar-logout', { visible: true } ),
	] );

	await page.click( '#wp-admin-bar-logout' );
}
