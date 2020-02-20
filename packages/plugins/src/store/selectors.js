/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Returns the single active area.
 *
 * @param {Object} state Global application state.
 * @param {string} scope Area scope.
 *
 * @return {string} Editing mode.
 */
export function getSingleActiveArea( state, scope ) {
	return state.areaControl.singleActiveAreas[ scope ];
}

/**
 * Returns if an area is pinned or not.
 *
 * @param {Object} state Global application state.
 * @param {string} scope Scope.
 * @param {string} area  Area to check.
 *
 * @return {boolean} True if an area is pinned and false otherwise.
 */
export function isMultipleActiveAreaActive( state, scope, area ) {
	return (
		get( state.areaControl.multipleActiveAreas, [ scope, area ] ) === true
	);
}
