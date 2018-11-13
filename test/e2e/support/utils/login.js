/**
 * Internal dependencies
 */
import { pressWithModifier } from './press-with-modifier';
import { META_KEY } from './';

const WP_ADMIN_USER = {
	username: 'admin',
	password: 'password',
};

const {
	WP_USERNAME = WP_ADMIN_USER.username,
	WP_PASSWORD = WP_ADMIN_USER.password,
} = process.env;

export async function login( username = WP_USERNAME, password = WP_PASSWORD ) {
	await page.focus( '#user_login' );
	await pressWithModifier( META_KEY, 'a' );
	await page.type( '#user_login', username );
	await page.focus( '#user_pass' );
	await pressWithModifier( META_KEY, 'a' );
	await page.type( '#user_pass', password );

	await Promise.all( [ page.waitForNavigation(), page.click( '#wp-submit' ) ] );
}
