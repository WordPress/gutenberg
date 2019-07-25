
export * from './selectors.js';

/**
 * Returns true if post title is selected.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether current post title is selected.
 */
export function isPostTitleSelected( state ) {
	return state.postTitle.isSelected;
}
