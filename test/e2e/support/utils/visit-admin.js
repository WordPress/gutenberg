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

export async function visitAdmin( adminPath, query ) {
	await goToWPPath( join( 'wp-admin', adminPath ), query );

	if ( isWPPath( 'wp-login.php' ) ) {
		await login();
		return visitAdmin( adminPath, query );
	}
}
