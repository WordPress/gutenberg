import EquivalentKeyMap from 'equivalent-key-map';
import getQueryParts from './get-query-parts';
import { setNestedValue } from '../utils';
import type { QueriedDataState, QueriedItemsOptions, Query } from './types';

/**
 * Cache of state keys to EquivalentKeyMap where the inner map tracks queries
 * to their resulting items set. WeakMap allows garbage collection on expired
 * state references.
 */
const queriedItemsCacheByState = new WeakMap<
	QueriedDataState< unknown >,
	EquivalentKeyMap< Query, Array< unknown > | null >
>();

/**
 * Returns items for a given query, or null if the items are not known.
 *
 * @param state                      State object.
 * @param query                      Optional query.
 * @param options                    Optional pagination options.
 * @param options.supportsPagination Whether the entity supports pagination. Default true.
 *
 * @return Query items.
 */
function getQueriedItemsUncached< Item >(
	state: QueriedDataState< Item >,
	query: Query,
	options: QueriedItemsOptions = {}
): Array< Item > | null {
	const { supportsPagination = true } = options;
	const {
		stableKey,
		page,
		perPage,
		offset: queryOffset,
		include,
		fields,
		context,
	} = getQueryParts( query );

	const itemIds = state.queries?.[ context ]?.[ stableKey ]?.itemIds;
	if ( ! itemIds ) {
		return null;
	}

	const isPaginated = supportsPagination && perPage !== -1;
	const startOffset = isPaginated
		? ( queryOffset ?? ( page - 1 ) * perPage )
		: 0;
	const endOffset = isPaginated
		? Math.min( startOffset + perPage, itemIds.length )
		: itemIds.length;

	// If the requested page range exceeds the stored itemIds, the data for
	// this specific pagination window may not have been fetched yet. Return
	// null unless totalItems confirms we already have all available items.
	if ( isPaginated && itemIds.length < startOffset + perPage ) {
		const totalItems =
			state.queries[ context ][ stableKey ].meta?.totalItems;
		// `isFinite` is false for a missing total.
		if ( Number.isFinite( totalItems ) && itemIds.length < totalItems! ) {
			return null;
		}
	}

	const items: Array< Item > = [];
	for ( let i = startOffset; i < endOffset; i++ ) {
		const itemId = itemIds[ i ];
		// Item IDs listed by an `include` query are numbers.
		if (
			Array.isArray( include ) &&
			! include.includes( itemId as number )
		) {
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

		let filteredItem: Item;
		if ( Array.isArray( fields ) ) {
			// The requested fields of the item, set below.
			filteredItem = {} as Item;

			for ( let f = 0; f < fields.length; f++ ) {
				const field = fields[ f ].split( '.' );
				let value: unknown = item;
				field.forEach( ( fieldName ) => {
					// Reads through whatever value the path reaches, as `?.` allows.
					value = ( value as Record< string, unknown > )?.[
						fieldName
					];
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
 * result per state (by reference) and per query (by deep equality), so that:
 *
 * `getQueriedItems( state, {} ) === getQueriedItems( state, {} )`
 *
 * @param state                      State object.
 * @param query                      Optional query.
 * @param options                    Optional pagination options.
 * @param options.supportsPagination Whether the entity supports pagination. Default true.
 *
 * @return Query items.
 */
export function getQueriedItems< Item >(
	state: QueriedDataState< Item >,
	query: Query = {},
	options: QueriedItemsOptions = {}
): Array< Item > | null {
	let queriedItemsCache = queriedItemsCacheByState.get( state );
	if ( queriedItemsCache ) {
		const queriedItems = queriedItemsCache.get( query );
		if ( queriedItems !== undefined ) {
			// Cached from this state, which holds `Item`s.
			return queriedItems as Array< Item > | null;
		}
	} else {
		queriedItemsCache = new EquivalentKeyMap();
		queriedItemsCacheByState.set( state, queriedItemsCache );
	}

	const items = getQueriedItemsUncached( state, query, options );
	queriedItemsCache.set( query, items );
	return items;
}

export function getQueriedTotalItems(
	state: QueriedDataState< unknown >,
	query: Query = {}
): number | null {
	const { stableKey, context } = getQueryParts( query );

	return state.queries?.[ context ]?.[ stableKey ]?.meta?.totalItems ?? null;
}

export function getQueriedTotalPages(
	state: QueriedDataState< unknown >,
	query: Query = {}
): number | null {
	const { stableKey, context } = getQueryParts( query );

	return state.queries?.[ context ]?.[ stableKey ]?.meta?.totalPages ?? null;
}
