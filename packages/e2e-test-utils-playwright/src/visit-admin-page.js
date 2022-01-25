/**
 * External dependencies
 */
import { join } from 'path';

/**
 * Visits admin page; if user is not logged in then it logging in it first, then visits admin page.
 *
 * @this {import('./').TestUtils}
 * @param {string} adminPath String to be serialized as pathname.
 * @param {string} query     String to be serialized as query portion of URL.
 */
export async function visitAdminPage( adminPath, query ) {
	await this.page.goto(
		this.createURL( join( 'wp-admin', adminPath ), query )
	);

	// Handle upgrade required screen
	if ( this.isCurrentURL( 'wp-admin/upgrade.php' ) ) {
		// Click update
		await this.page.click( '.button.button-large.button-primary' );
		// Click continue
		await this.page.click( '.button.button-large' );
	}

	if ( this.isCurrentURL( 'wp-login.php' ) ) {
		await this.loginUser();
		await this.visitAdminPage( adminPath, query );
	}

	const error = await this.getPageError();
	if ( error ) {
		throw new Error( 'Unexpected error in page content: ' + error );
	}
}
