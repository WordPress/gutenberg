/**
 * Node dependencies
 */
import { join } from 'path';

/**
 * Internal dependencies
 */
import { goToWPPath } from './go-to-wp-path';
import { isWPPath } from './is-wp-path';
import { login } from './login';

/**
 * Visits admin page; if user is not logged in then it logging in it first, then visits admin page.
 * @param {string} adminPath String to be serialized as pathname.
 * @param {string} query String to be serialized as query portion of URL.
 */
export async function visitAdmin( adminPath, query ) {
	await goToWPPath( join( 'wp-admin', adminPath ), query );

	if ( isWPPath( 'wp-login.php' ) ) {
		await login();
		await visitAdmin( adminPath, query );
	}
}
