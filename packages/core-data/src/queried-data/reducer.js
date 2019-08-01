/**
 * External dependencies
 */
import { keyBy, map, flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	ifMatchingAction,
	replaceAction,
	onSubKey,
} from '../utils';
import { DEFAULT_ENTITY_KEY } from '../entities';
import getQueryParts from './get-query-parts';

/**
 * Returns a merged array of item IDs, given details of the received paginated
 * items. The array is sparse-like with `undefined` entries where holes exist.
 *
 * @param {?Array<number>} itemIds     Original item IDs (default empty array).
 * @param {number[]}       nextItemIds Item IDs to merge.
 * @param {number}         page        Page of items merged.
 * @param {number}         perPage     Number of items per page.
 *
 * @return {number[]} Merged array of item IDs.
 */
export function getMergedItemIds( itemIds, nextItemIds, page, perPage ) {
	const nextItemIdsStartIndex = ( page - 1 ) * perPage;

	// If later page has already been received, default to the larger known
	// size of the existing array, else calculate as extending the existing.
	const size = Math.max(
		itemIds.length,
		nextItemIdsStartIndex + nextItemIds.length
	);

	// Preallocate array since size is known.
	const mergedItemIds = new Array( size );

	for ( let i = 0; i < size; i++ ) {
		// Preserve existing item ID except for subset of range of next items.
		const isInNextItemsRange = (
			i >= nextItemIdsStartIndex &&
			i < nextItemIdsStartIndex + nextItemIds.length
		);

		mergedItemIds[ i ] = isInNextItemsRange ?
			nextItemIds[ i - nextItemIdsStartIndex ] :
			itemIds[ i ];
	}

	return mergedItemIds;
}

/**
 * Reducer tracking items state, keyed by ID. Items are assumed to be normal,
 * where identifiers are common across all queries.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Next state.
 */
function items( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_ITEMS':
			return {
				...state,
				...keyBy( action.items, action.key || DEFAULT_ENTITY_KEY ),
			};
	}

	return state;
}

/**
 * Reducer tracking queries state, keyed by stable query key. Each reducer
 * query object includes `itemIds` and `requestingPageByPerPage`.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Next state.
 */
const queries = flowRight( [
	// Limit to matching action type so we don't attempt to replace action on
	// an unhandled action.
	ifMatchingAction( ( action ) => 'query' in action ),

	// Inject query parts into action for use both in `onSubKey` and reducer.
	replaceAction( ( action ) => {
		// `ifMatchingAction` still passes on initialization, where state is
		// undefined and a query is not assigned. Avoid attempting to parse
		// parts. `onSubKey` will omit by lack of `stableKey`.
		if ( action.query ) {
			return {
				...action,
				...getQueryParts( action.query ),
			};
		}

		return action;
	} ),

	// Queries shape is shared, but keyed by query `stableKey` part. Original
	// reducer tracks only a single query object.
	onSubKey( 'stableKey' ),
] )( ( state = null, action ) => {
	const { type, page, perPage, key = DEFAULT_ENTITY_KEY } = action;

	if ( type !== 'RECEIVE_ITEMS' ) {
		return state;
	}

	return getMergedItemIds(
		state || [],
		map( action.items, key ),
		page,
		perPage
	);
} );

export default combineReducers( {
	items,
	queries,
} );
