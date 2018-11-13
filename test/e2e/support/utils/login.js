/**
 * Internal dependencies
 */
import { pressWithModifier } from './press-with-modifier';
import { META_KEY } from './';
import { WP_USERNAME, WP_PASSWORD } from './config';

export async function login( username = WP_USERNAME, password = WP_PASSWORD ) {
	await page.focus( '#user_login' );
	await pressWithModifier( META_KEY, 'a' );
	await page.type( '#user_login', username );
	await page.focus( '#user_pass' );
	await pressWithModifier( META_KEY, 'a' );
	await page.type( '#user_pass', password );

	await Promise.all( [ page.waitForNavigation(), page.click( '#wp-submit' ) ] );
}
