
/**
 * Internal dependencies
 */
import { WP_USERNAME, WP_PASSWORD } from './config';
import { pressWithModifier } from './press-with-modifier';

export async function login( username = WP_USERNAME, password = WP_PASSWORD ) {
	await page.focus( '#user_login' );
	await pressWithModifier( 'primary', 'a' );
	await page.type( '#user_login', username );
	await page.focus( '#user_pass' );
	await pressWithModifier( 'primary', 'a' );
	await page.type( '#user_pass', password );

	await Promise.all( [ page.waitForNavigation(), page.click( '#wp-submit' ) ] );
}
