/**
 * External dependencies
 */
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

/**
 * Internal dependencies
 */
import { editPost } from './actions.js';

export * from './actions.js';

/**
 * Returns an action object that enables or disables post title selection.
 *
 * @param {boolean} [isSelected=true] Whether post title is currently selected.
 *
 * @return {Object} Action object.
 */
export function togglePostTitleSelection( isSelected = true ) {
	return {
		type: 'TOGGLE_POST_TITLE_SELECTION',
		isSelected,
	};
}

/**
 * Action generator used in signalling that the post should autosave.
 */
export function* autosave() {
	RNReactNativeGutenbergBridge.editorDidAutosave();
}

/**
 * Action generator to set the selected layout template.
 *
 * @param {Object} template Layout's template
 */
export function* setLayoutTemplate( template ) {
	yield* editPost( { title: template.name, blocks: template.content } );
}
