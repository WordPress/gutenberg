/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/format-library';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
export { store } from './store';
import Editor from './editor';

/**
 * Initializes the Editor and returns a componentProvider
 * that can be registered with `AppRegistry.registerComponent`
 *
 * @param {string} id       Unique identifier for editor instance.
 * @param {Object} postType Post type of the post to edit.
 * @param {Object} postId   ID of the post to edit (unused right now)
 */
export function initializeEditor( id, postType, postId ) {
	dispatch( preferencesStore ).setDefaults( 'core/edit-post', {
		editorMode: 'visual',
		fixedToolbar: false,
		fullscreenMode: true,
		hiddenBlockTypes: [],
		preferredStyleVariations: {},
		welcomeGuide: true,
	} );

	return <Editor postId={ postId } postType={ postType } />;
}
