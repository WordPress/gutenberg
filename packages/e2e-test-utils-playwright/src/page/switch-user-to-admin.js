/**
 * Internal dependencies
 */
import { WP_ADMIN_USER } from '../config';

/**
 * Switches the current user to the admin user (if the user
 * running the test is not already the admin user).
 *
 * @this {import('.').PageUtils}
 */
export async function switchUserToAdmin() {
	if ( ( await this.getCurrentUser() ) === WP_ADMIN_USER.username ) {
		return;
	}
	await this.loginUser( WP_ADMIN_USER );
}
