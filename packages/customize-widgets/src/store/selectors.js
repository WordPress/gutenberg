/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Returns whether the given feature is enabled or not.
 *
 * This function is unstable, as it is mostly copied from the edit-post
 * package. Editor features and preferences have a lot of scope for
 * being generalized and refactored.
 *
 * @param {Object} state   Global application state.
 * @param {string} feature Feature slug.
 *
 * @return {boolean} Is active.
 */
export function __unstableIsFeatureActive( state, feature ) {
	return get( state.preferences.features, [ feature ], false );
}

/**
 * Returns true if the inserter is opened.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the inserter is opened.
 */
export function isInserterOpened( state ) {
	return !! state.blockInserterPanel;
}

/**
 * Get the insertion point for the inserter.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The root client ID and index to insert at.
 */
export function __experimentalGetInsertionPoint( state ) {
	const { rootClientId, insertionIndex } = state.blockInserterPanel;
	return { rootClientId, insertionIndex };
}
