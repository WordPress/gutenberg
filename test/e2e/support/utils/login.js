
/**
 * Internal dependencies
 */
import { WP_USERNAME, WP_PASSWORD } from './config';
import { pressWithModifier } from './press-with-modifier';

/**
 * Performs log in with specified username and password.
 *
 * @param {?string} username String to be used as user credential.
 * @param {?string} password String to be used as user credential.
 */
export async function login( username = WP_USERNAME, password = WP_PASSWORD ) {
	await page.focus( '#user_login' );
	await pressWithModifier( 'primary', 'a' );
	await page.type( '#user_login', username );
	await page.focus( '#user_pass' );
	await pressWithModifier( 'primary', 'a' );
	await page.type( '#user_pass', password );

	await Promise.all( [ page.waitForNavigation(), page.click( '#wp-submit' ) ] );
}
