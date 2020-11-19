/**
 * Updates the query args in the window to match the given context.
 *
 * @param {string} contextType Current context of the site editor,
 * 'wp_template', 'wp_template_part', or 'content'.
 * @param {number|string} identifier Identifier for the given context.
 * This may be a postId for 'wp_template' or 'wp_template_part', or may
 * be a JSON string representing the 'page' state in the edit-site store
 * for various content contexts.
 */
export default function updateQueryParams( contextType, identifier ) {
	const queryParams = new URLSearchParams( window.location.search );
	if ( contextType === 'content' ) {
		queryParams.delete( 'id' );
		queryParams.set( 'contextType', contextType );
		queryParams.set( 'content', identifier );
	} else {
		queryParams.delete( 'content' );
		queryParams.set( 'contextType', contextType );
		queryParams.set( 'id', identifier );
	}
	window.history.replaceState( {}, '', `?${ queryParams }` );
}
