/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/format-library';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
export { store } from './store';
import Editor from './editor';

let editorInitialized = false;

/**
 * Initializes the Editor and returns a componentProvider
 * that can be registered with `AppRegistry.registerComponent`
 *
 * @param {string} id       Unique identifier for editor instance.
 * @param {Object} postType Post type of the post to edit.
 * @param {Object} postId   ID of the post to edit (unused right now)
 */
export function initializeEditor( id, postType, postId ) {
	if ( editorInitialized ) {
		return;
	}

	editorInitialized = true;

	render( <Editor postId={ postId } postType={ postType } />, id );
}
