/**
 * WordPress dependencies
 */
import '@wordpress/core-data';
import '@wordpress/format-library';

/**
 * Internal dependencies
 */
export { store } from './store';
import Editor from './editor';
import configurePreferences from './utils/configure-preferences';

/**
 * Initializes the Editor and returns a componentProvider
 * that can be registered with `AppRegistry.registerComponent`
 *
 * @param {string} id       Unique identifier for editor instance.
 * @param {Object} postType Post type of the post to edit.
 * @param {Object} postId   ID of the post to edit (unused right now)
 */
export async function initializeEditor( id, postType, postId ) {
	await configurePreferences( {
		editorMode: 'visual',
		fixedToolbar: false,
		fullscreenMode: true,
		hiddenBlockTypes: [],
		inactivePanels: [],
		isPublishSidebarEnabled: true,
		openPanels: [ 'post-status' ],
		preferredStyleVariations: {},
		welcomeGuide: true,
	} );

	return <Editor postId={ postId } postType={ postType } />;
}
