/**
 * WordPress dependencies
 */
import RNReactNativeGutenbergBridge from '@wordpress/react-native-bridge';

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
 * Returns an action object to track the last block that was inserted.
 *
 * @param {Object} clientId The client id of the block.
 *
 * @return {Object} Action object.
 */
export function addLastBlockInserted( clientId ) {
	return {
		type: 'ADD_LAST_BLOCK_INSERTED',
		clientId,
	};
}

/**
 * Returns an action object to clear the last block that was inserted.
 *
 * @return {Object} Action object.
 */
export function clearLastBlockInserted() {
	return {
		type: 'CLEAR_LAST_BLOCK_INSERTED',
	};
}
