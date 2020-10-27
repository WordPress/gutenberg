/**
 * External dependencies
 */
import createSelector from 'rememo';
import EquivalentKeyMap from 'equivalent-key-map';
import { get, set } from 'lodash';

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
	const { stableKey, page, perPage, include, fields } = getQueryParts(
		query
	);
	let itemIds;
	if ( Array.isArray( include ) && ! stableKey ) {
		// If the parsed query yields a set of IDs, but otherwise no filtering,
		// it's safe to consider targeted item IDs as the include set. This
		// doesn't guarantee that those objects have been queried, which is
		// accounted for below in the loop `null` return.
		itemIds = include;
		// TODO: Avoid storing the empty stable string in reducer, since it
		// can be computed dynamically here always.
	} else if ( state.queries[ stableKey ] ) {
		itemIds = state.queries[ stableKey ];
	}

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
		if ( Array.isArray( include ) && ! include.includes( itemId ) ) {
			continue;
		}

		if ( ! state.items.hasOwnProperty( itemId ) ) {
			return null;
		}

		const item = state.items[ itemId ];

		let filteredItem;
		if ( Array.isArray( fields ) ) {
			filteredItem = {};

			for ( let f = 0; f < fields.length; f++ ) {
				const field = fields[ f ].split( '.' );
				const value = get( item, field );
				set( filteredItem, field, value );
			}
		} else {
			// If expecting a complete item, validate that completeness, or
			// otherwise abort.
			if ( ! state.itemIsComplete[ itemId ] ) {
				return null;
			}

			filteredItem = item;
		}

		items.push( filteredItem );
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
