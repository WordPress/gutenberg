/**
 * Internal dependencies
 */
import { WP_USERNAME, WP_PASSWORD } from './shared/config';

/**
 * Performs log in with specified username and password.
 *
 * @this {import('./').TestUtils}
 * @param {?string} username String to be used as user credential.
 * @param {?string} password String to be used as user credential.
 */
export async function loginUser(
	username = WP_USERNAME,
	password = WP_PASSWORD
) {
	if ( ! this.isCurrentURL( 'wp-login.php' ) ) {
		await this.page.goto( this.createURL( 'wp-login.php' ) );
	}

	await this.page.press( '#user_login', 'Control+A' );
	await this.page.type( '#user_login', username );
	await this.page.press( '#user_pass', 'Control+A' );
	await this.page.type( '#user_pass', password );

	await Promise.all( [
		this.page.waitForNavigation(),
		this.page.click( '#wp-submit' ),
	] );
}
