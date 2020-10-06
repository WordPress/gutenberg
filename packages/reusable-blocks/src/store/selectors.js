/**
 * External dependencies
 */
import { map } from 'lodash';
import createSelector from 'rememo';

/**
 * Returns the reusable block with the given ID.
 *
 * @param {Object}        state Global application state.
 * @param {number|string} ref   The reusable block's ID.
 *
 * @return {Object} The reusable block, or null if none exists.
 */
export const __experimentalGetReusableBlock = createSelector(
	( state, ref ) => {
		const block = state.data[ ref ];
		if ( ! block ) {
			return null;
		}

		const isTemporary = isNaN( parseInt( ref ) );

		return {
			...block,
			id: isTemporary ? ref : +ref,
			isTemporary,
		};
	},
	( state, ref ) => [ state.data[ ref ] ]
);

/**
 * Returns whether or not the reusable block with the given ID is being saved.
 *
 * @param {Object} state Global application state.
 * @param {string} ref   The reusable block's ID.
 *
 * @return {boolean} Whether or not the reusable block is being saved.
 */
export function __experimentalIsSavingReusableBlock( state, ref ) {
	return state.isSaving[ ref ] || false;
}

/**
 * Returns true if the reusable block with the given ID is being fetched, or
 * false otherwise.
 *
 * @param {Object} state Global application state.
 * @param {string} ref   The reusable block's ID.
 *
 * @return {boolean} Whether the reusable block is being fetched.
 */
export function __experimentalIsFetchingReusableBlock( state, ref ) {
	return !! state.isFetching[ ref ];
}

/**
 * Returns an array of all reusable blocks.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} An array of all reusable blocks.
 */
export const __experimentalGetReusableBlocks = createSelector(
	( state ) => {
		return map( state.data, ( value, ref ) =>
			__experimentalGetReusableBlock( state, ref )
		);
	},
	( state ) => [ state.data ]
);
