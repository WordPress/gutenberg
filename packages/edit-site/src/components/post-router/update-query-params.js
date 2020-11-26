/**
 * WordPress dependencies
 */
import { removeQueryArgs, addQueryArgs } from '@wordpress/url';

/**
 * Updates the query args in the window to match the given context.
 *
 * @param {string}        contextType Current context of the site editor,
 *                                    'wp_template', 'wp_template_part', or 'content'.
 * @param {number|string} identifier  Identifier for the given context. This may
 *                                    be a postId for 'wp_template' or 'wp_template_part',
 *                                    or may be a JSON string representing the
 *                                    'page' state in the edit-site store for
 *                                    various content contexts.
 */
export default function updateQueryParams( contextType, identifier ) {
	let url = window.location.href;
	if ( contextType === 'content' ) {
		url = removeQueryArgs( url, 'id' );
		url = addQueryArgs( url, { content: identifier } );
	} else {
		url = removeQueryArgs( url, 'content' );
		url = addQueryArgs( url, { id: identifier } );
	}
	url = addQueryArgs( url, { contextType } );
	window.history.replaceState( {}, '', url );
}
