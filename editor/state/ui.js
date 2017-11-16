/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getEditedPostTitle, isCleanNewPost } from './editor';

/**
 * Selectors
 */

/**
 * Gets the document title to be used.
 *
 * @param  {Object}  state Global application state
 * @return {string}        Document title
 */
export function getDocumentTitle( state ) {
	let title = getEditedPostTitle( state );

	if ( ! title.trim() ) {
		title = isCleanNewPost( state ) ? __( 'New post' ) : __( '(Untitled)' );
	}
	return title;
}
