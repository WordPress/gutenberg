/**
 * External dependencies
 */
import createSelector from 'rememo';
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * Internal dependencies
 */
import getQueryParts from './get-query-parts';

/**
 * Cache of state keys to EquivalentKeyMap where the inner map tracks queries
 * to their resulting items set. WeakMap allows garbage collection on expired
 * state references.
 *
 * @type {WeakMap<Object,EquivalentKeyMap>}
 */
const queriedItemsCacheByState = new WeakMap();

/**
 * Returns items for a given query, or null if the items are not known.
 *
 * @param {Object}  state State object.
 * @param {?Object} query Optional query.
 *
 * @return {?Array} Query items.
 */
function getQueriedItemsUncached( state, query ) {
	const { stableKey, page, perPage } = getQueryParts( query );

	if ( ! state.queries[ stableKey ] ) {
		return null;
	}

	const itemIds = state.queries[ stableKey ];
	if ( ! itemIds ) {
		return null;
	}

	const startOffset = perPage === -1 ? 0 : ( page - 1 ) * perPage;
	const endOffset =
		perPage === -1
			? itemIds.length
			: Math.min( startOffset + perPage, itemIds.length );

	const items = [];
	for ( let i = startOffset; i < endOffset; i++ ) {
		const itemId = itemIds[ i ];
		items.push( state.items[ itemId ] );
	}

	return items;
}

/**
 * Returns items for a given query, or null if the items are not known. Caches
 * result both per state (by reference) and per query (by deep equality).
 * The caching approach is intended to be durable to query objects which are
 * deeply but not referentially equal, since otherwise:
 *
 * `getQueriedItems( state, {} ) !== getQueriedItems( state, {} )`
 *
 * @param {Object}  state State object.
 * @param {?Object} query Optional query.
 *
 * @return {?Array} Query items.
 */
export const getQueriedItems = createSelector( ( state, query = {} ) => {
	let queriedItemsCache = queriedItemsCacheByState.get( state );
	if ( queriedItemsCache ) {
		const queriedItems = queriedItemsCache.get( query );
		if ( queriedItems !== undefined ) {
			return queriedItems;
		}
	} else {
		queriedItemsCache = new EquivalentKeyMap();
		queriedItemsCacheByState.set( state, queriedItemsCache );
	}

	const items = getQueriedItemsUncached( state, query );
	queriedItemsCache.set( query, items );
	return items;
} );
