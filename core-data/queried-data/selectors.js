/**
 * External dependencies
 */
import { get } from 'lodash';
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
 * Utility function returning the current value of `requestingPageByPerPage`
 * for the given state and optional query. Returns undefined if no requests
 * have been initiated for the given query page, otherwise a boolean value
 * representing whether a request is in progress.
 *
 * @param {Object}  state State object.
 * @param {?Object} query Optional query.
 *
 * @return {?boolean} `requestingPageByPerPage` value for query.
 */
function getRequestingPageByPerPage( state, query = {} ) {
	const { stableKey, page, perPage } = getQueryParts( query );

	return get( state, [
		'queries',
		stableKey,
		'requestingPageByPerPage',
		perPage,
		page,
	] );
}

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

	const itemIds = state.queries[ stableKey ].itemIds;
	if ( ! itemIds ) {
		return null;
	}

	const startOffset = ( page - 1 ) * perPage;
	const endOffset = Math.min(
		startOffset + perPage,
		itemIds.length
	);

	const items = [];
	for ( let i = startOffset; i < endOffset; i++ ) {
		const itemId = itemIds[ i ];
		items.push( state.items[ itemId ] );
	}

	return items;
}

/**
 * Returns items for a given query, or null if the items are not known. Caches
 * result by both per state (by reference) and per query (by deep equality).
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

/**
 * Returns true if a request has been initiated for query items, or false
 * otherwise.
 *
 * @param {Object}  state State object.
 * @param {?Object} query Optional query.
 *
 * @return {boolean} Whether a request has been initiated.
 */
export function hasRequestedQueryItems( state, query ) {
	return undefined !== getRequestingPageByPerPage( state, query );
}

/**
 * Returns true if a request is in progress for query items, or false
 * otherwise.
 *
 * @param {Object}  state State object.
 * @param {?Object} query Optional query.
 *
 * @return {boolean} Whether a request is in progress.
 */
export function isRequestingQueryItems( state, query ) {
	return Boolean( getRequestingPageByPerPage( state, query ) );
}
