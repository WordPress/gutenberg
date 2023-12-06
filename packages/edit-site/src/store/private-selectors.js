/**
 * Internal dependencies
 */
import { FOCUSABLE_ENTITIES } from '../utils/constants';

import { getEditedPostType } from './selectors';

/**
 * Returns the current canvas mode.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Canvas mode.
 */
export function getCanvasMode( state ) {
	return state.canvasMode;
}

/**
 * Returns the editor canvas container view.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Editor canvas container view.
 */
export function getEditorCanvasContainerView( state ) {
	return state.editorCanvasContainerView;
}

export function isEntityFocusMode( state ) {
	const postType = getEditedPostType( state );
	return FOCUSABLE_ENTITIES.includes( postType );
}
