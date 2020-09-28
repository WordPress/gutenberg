/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import { Preview } from '@wordpress/block-editor';
import '@wordpress/viewport';
import '@wordpress/notices';
import '@wordpress/format-library';
import { render } from '@wordpress/element';
import { rawHandler } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './store';
import Editor from './editor';

let editorInitialized = false;

/**
 * Initializes the Editor and returns a componentProvider
 * that can be registered with `AppRegistry.registerComponent`
 *
 * @param {string}  id           Unique identifier for editor instance.
 * @param {Object}  postType     Post type of the post to edit.
 * @param {Object}  postId       ID of the post to edit (unused right now)
 */
export function initializeEditor( id, postType, postId ) {
	if ( editorInitialized ) {
		return;
	}

	editorInitialized = true;

	render( <EditorMode postId={ postId } postType={ postType } />, id );
}

function EditorMode( props ) {
	const { initialHtml, editorMode } = props;

	if ( editorMode === 'preview' ) {
		return <Preview blocks={ rawHandler( { HTML: initialHtml } ) } />;
	}

	return <Editor { ...props } />;
}
