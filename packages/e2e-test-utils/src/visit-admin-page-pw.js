/**
 * External dependencies
 */
import { join } from 'path';

/**
 * Internal dependencies
 */
/**
 * Internal dependencies
 */
import { createURL } from './create-url';
import { isCurrentURL } from './is-current-url';
import { loginUserPw } from './login-user-pw';
import { getPageError } from './get-page-error';

/**
 * Visits admin page; if user is not logged in then it logging in it first, then visits admin page.
 *
 * @param {string} adminPath String to be serialized as pathname.
 * @param {string} query     String to be serialized as query portion of URL.
 */
export async function visitAdminPage( adminPath, query ) {
	await page.goto( createURL( join( 'wp-admin', adminPath ), query ) );

	// Handle upgrade required screen
	if ( isCurrentURL( 'wp-admin/upgrade.php' ) ) {
		// Click update
		await page.click( '.button.button-large.button-primary' );
		// Click continue
		await page.click( '.button.button-large' );
	}

	if ( isCurrentURL( 'wp-login.php' ) ) {
		await loginUserPw();
		await visitAdminPage( adminPath, query );
	}

	const error = await getPageError();
	if ( error ) {
		throw new Error( 'Unexpected error in page content: ' + error );
	}
}
