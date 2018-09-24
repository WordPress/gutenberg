import { visitAdmin } from './utils';

/**
 * Creates a WP user.
 *
 * @param {string} username
 * @param {string} password
 * @param {string} email
 * @param {string} role
 */
export async function newUser( username, password, email, role ) {
	await visitAdmin( 'user-new.php' );

	await page.type( '#user_login', username );
	await page.type( '#email', email );
	await page.click( '.wp-generate-pw' );
	await page.type( '#pass1', password );
	await page.click( '.pw-checkbox' );
	await page.select( '#role', role );

	await page.click( '#createusersub' );

	await page.waitForXPath(
		'//*[contains(@class, "updated notice")]/p[contains(text(), "New user created.")]'
	);
}
