/**
 * Get the username of the user that's currently logged into WordPress (if any).
 *
 * @this {import('./').TestUtils}
 * @return {string?} username The user that's currently logged into WordPress (if any).
 */
export async function getCurrentUser() {
	const cookies = await this.context.cookies();
	const cookie = cookies.find(
		( c ) => !! c?.name?.startsWith( 'wordpress_logged_in_' )
	);

	if ( ! cookie?.value ) {
		return;
	}
	return decodeURIComponent( cookie.value ).split( '|' )[ 0 ];
}
