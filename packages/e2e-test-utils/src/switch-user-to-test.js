/**
 * Internal dependencies
 */
import { loginUser } from './login-user';
import { WP_USERNAME, WP_ADMIN_USER } from './shared/config';

/**
 * Switches the current user to whichever user we should be
 * running the tests as (if we're not already that user).
 */
export async function switchUserToTest() {
	if ( WP_USERNAME === WP_ADMIN_USER.username ) {
		return;
	}
	await loginUser();
}
