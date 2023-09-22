/**
 * Internal dependencies
 */
import { hasPageContentFocus } from './selectors';

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

/**
 * Returns the type of the current page content focus, or null if there is no
 * page content focus.
 *
 * Possible values are:
 *
 * - `'disableTemplate'`: Disable the blocks belonging to the page's template.
 * - `'hideTemplate'`: Hide the blocks belonging to the page's template.
 *
 * @param {Object} state Global application state.
 *
 * @return {'disableTemplate'|'hideTemplate'|null} Type of the current page content focus.
 */
export function getPageContentFocusType( state ) {
	return hasPageContentFocus( state ) ? state.pageContentFocusType : null;
}
