/**
 * Internal dependencies
 */
import { WP_ADMIN_USER } from './shared/config';

/**
 * Switches the current user to the admin user (if the user
 * running the test is not already the admin user).
 *
 * @this {import('./').TestUtils}
 */
export async function switchUserToAdmin() {
	if ( ( await this.getCurrentUser() ) === WP_ADMIN_USER.username ) {
		return;
	}
	await this.loginUser( WP_ADMIN_USER.username, WP_ADMIN_USER.password );
}
