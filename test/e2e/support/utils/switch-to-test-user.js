/**
 * Internal dependencies
 */
import { goToWPPath } from './go-to-wp-path';
import { login } from './login';
import { WP_USERNAME, WP_ADMIN_USER } from './config';

/**
 * Switches the current user to whichever user we should be
 * running the tests as (if we're not already that user).
 */
export async function switchToTestUser() {
	if ( WP_USERNAME === WP_ADMIN_USER.username ) {
		return;
	}
	await goToWPPath( 'wp-login.php' );
	await login();
}
