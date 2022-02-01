/**
 * Internal dependencies
 */
import { WP_USERNAME, WP_PASSWORD } from './shared/config';
import { createURL } from './create-url';
import { isCurrentURL } from './is-current-url';

/**
 * Performs log in with specified username and password.
 *
 * @param {?string} username String to be used as user credential.
 * @param {?string} password String to be used as user credential.
 */
export async function loginUserPw(
	username = WP_USERNAME,
	password = WP_PASSWORD
) {
	if ( ! isCurrentURL( 'wp-login.php' ) ) {
		await page.goto( createURL( 'wp-login.php' ) );
	}

	await page.focus( '#user_login' );
	await page.press( '#user_login', 'Meta+KeyA' );
	await page.type( '#user_login', username );
	await page.focus( '#user_pass' );
	await page.press( '#user_pass', 'Meta+KeyA' );
	await page.type( '#user_pass', password );

	await page.click( '#wp-submit' );
}
