/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/block-editor';
import '@wordpress/viewport';
import '@wordpress/notices';
import { registerCoreBlocks } from '@wordpress/block-library';
import '@wordpress/format-library';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './store';
import Editor from './editor';

let blocksRegistered = false;

/**
 * Initializes the Editor and returns a componentProvider
 * that can be registered with `AppRegistry.registerComponent`
 *
 * @param {string}  id           Unique identifier for editor instance.
 * @param {Object}  postType     Post type of the post to edit.
 * @param {Object}  postId       ID of the post to edit (unused right now)
 */
export function initializeEditor( id, postType, postId ) {
	if ( blocksRegistered ) {
		return;
	}

	// register and setup blocks
	registerCoreBlocks();
	blocksRegistered = true;

	render( <Editor postId={ postId } postType={ postType } />, id );
}
