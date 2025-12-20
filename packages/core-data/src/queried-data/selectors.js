/**
 * External dependencies
 */
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * WordPress dependencies
 */
import { createSelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import getQueryParts from './get-query-parts';
import { setNestedValue } from '../utils';

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
	const { stableKey, page, perPage, include, fields, context } =
		getQueryParts( query );
	let itemIds;

	if ( state.queries?.[ context ]?.[ stableKey ] ) {
		itemIds = state.queries[ context ][ stableKey ].itemIds;
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
		if ( itemId === undefined ) {
			continue;
		}
		// Having a target item ID doesn't guarantee that this object has been queried.
		if ( ! state.items[ context ]?.hasOwnProperty( itemId ) ) {
			return null;
		}

		const item = state.items[ context ][ itemId ];

		let filteredItem;
		if ( Array.isArray( fields ) ) {
			filteredItem = {};

			for ( let f = 0; f < fields.length; f++ ) {
				const field = fields[ f ].split( '.' );
				let value = item;
				field.forEach( ( fieldName ) => {
					value = value?.[ fieldName ];
				} );

				setNestedValue( filteredItem, field, value );
			}
		} else {
			// If expecting a complete item, validate that completeness, or
			// otherwise abort.
			if ( ! state.itemIsComplete[ context ]?.[ itemId ] ) {
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

export function getQueriedTotalItems( state, query = {} ) {
	const { stableKey, context } = getQueryParts( query );

	return state.queries?.[ context ]?.[ stableKey ]?.meta?.totalItems ?? null;
}

export function getQueriedTotalPages( state, query = {} ) {
	const { stableKey, context } = getQueryParts( query );

	return state.queries?.[ context ]?.[ stableKey ]?.meta?.totalPages ?? null;
}
