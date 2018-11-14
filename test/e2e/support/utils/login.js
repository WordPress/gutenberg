/**
 * WordPress dependencies
 */
import { rawShortcut } from '@wordpress/keycodes';

import { WP_USERNAME, WP_PASSWORD } from './config';

export async function login( username = WP_USERNAME, password = WP_PASSWORD ) {
	await page.focus( '#user_login' );
	await page.keyboard.down( rawShortcut.primary( 'a' ) );
	await page.type( '#user_login', username );
	await page.focus( '#user_pass' );
	await page.keyboard.down( rawShortcut.primary( 'a' ) );
	await page.type( '#user_pass', password );

	await Promise.all( [ page.waitForNavigation(), page.click( '#wp-submit' ) ] );
}
