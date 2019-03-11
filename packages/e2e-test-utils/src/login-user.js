/**
 * Internal dependencies
 */
import { WP_USERNAME, WP_PASSWORD } from './shared/config';
import { createURL } from './create-url';
import { isCurrentURL } from './is-current-url';
import { __unstableSelectAll } from './select-all';

/**
 * Performs log in with specified username and password.
 *
 * @param {?string} username String to be used as user credential.
 * @param {?string} password String to be used as user credential.
 */
export async function loginUser( username = WP_USERNAME, password = WP_PASSWORD ) {
	if ( ! isCurrentURL( 'wp-login.php' ) ) {
		await page.goto(
			createURL( 'wp-login.php' )
		);
	}

	await page.focus( '#user_login' );
	await __unstableSelectAll();
	await page.type( '#user_login', username );
	await page.focus( '#user_pass' );
	await __unstableSelectAll();
	await page.type( '#user_pass', password );

	await Promise.all( [ page.waitForNavigation(), page.click( '#wp-submit' ) ] );
}
