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
export async function loginUser( username = WP_USERNAME, password = WP_PASSWORD ) {
	if ( ! isCurrentURL( 'wp-login.php' ) ) {
		await page.goto(
			createURL( 'wp-login.php' )
		);
	}

	// Explicitly assign values of form, since the username is prefilled if
	// already logged in. This could be done by keyboard interactions as well,
	// but as of Puppeteer 1.6.1, Cmd+A does not work as expected in Mac,
	// making it difficult to erase the contents of the field.
	//
	// See: https://github.com/GoogleChrome/puppeteer/issues/1313
	await page.evaluate( ( _username, _password ) => {
		document.getElementById( 'user_login' ).value = _username;
		document.getElementById( 'user_pass' ).value = _password;
	}, username, password );

	await Promise.all( [ page.waitForNavigation(), page.click( '#wp-submit' ) ] );
}
