/**
 * Internal dependencies
 */
import './wp-init.js';
import '@wordpress/core-data';

/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

export function getPostContent() {
	return select( 'core/editor' ).getEditedPostContent();
}

export { initializeEditor } from '@wordpress/edit-post';
