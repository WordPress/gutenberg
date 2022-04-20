/**
 * Internal dependencies
 */
import { WP_ADMIN_USER, WP_USERNAME } from '../config';

/**
 * Switches the current user to the admin user (if the user
 * running the test is not already the admin user).
 *
 * @this {import('./').PageUtils}
 */
export async function switchUserToAdmin() {
	if ( ( await this.getCurrentUser() ) === WP_ADMIN_USER.username ) {
		return;
	}
	await this.loginUser( WP_ADMIN_USER.username, WP_ADMIN_USER.password );
}

/**
 * Switches the current user to whichever user we should be
 * running the tests as (if we're not already that user).
 *
 * @this {import('./').PageUtils}
 */
export async function switchUserToTest() {
	if ( ( await this.getCurrentUser() ) === WP_USERNAME ) {
		return;
	}
	await this.loginUser();
}
