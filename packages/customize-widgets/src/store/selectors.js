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
