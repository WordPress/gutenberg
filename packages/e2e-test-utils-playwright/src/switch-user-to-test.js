/**
 * Internal dependencies
 */
import { WP_USERNAME } from './shared/config';

/**
 * Switches the current user to whichever user we should be
 * running the tests as (if we're not already that user).
 *
 * @this {import('./').TestUtils}
 */
export async function switchUserToTest() {
	if ( ( await this.getCurrentUser() ) === WP_USERNAME ) {
		return;
	}
	await this.loginUser();
}
