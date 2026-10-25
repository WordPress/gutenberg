import { combineReducers, keyedReducer } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { conservativeMapItem, ifMatchingAction, replaceAction } from '../utils';
import { DEFAULT_ENTITY_KEY } from '../entities';
import getQueryParts from './get-query-parts';
import type {
	ItemId,
	QueriedDataAction,
	QueriedItem,
	QueriesState,
	QueryParts,
	QueryState,
	ReceiveItemsAction,
} from './types';

function getContextFromAction( action: ReceiveItemsAction ): string {
	const { query } = action;
	if ( ! query ) {
		return 'default';
	}

	const queryParts = getQueryParts( query );
	return queryParts.context;
}

/**
 * Returns a merged array of item IDs, given details of the received paginated
 * items. The array is sparse-like with `undefined` entries where holes exist.
 *
 * @param itemIds         Original item IDs (default empty array).
 * @param nextItemIds     Item IDs to merge.
 * @param options         Options object.
 * @param options.page    Page of items merged.
 * @param options.offset  Offset of items merged.
 * @param options.perPage Number of items per page.
 *
 * @return Merged array of item IDs.
 */
export function getMergedItemIds(
	itemIds: ReadonlyArray< ItemId | undefined > = [],
	nextItemIds: ReadonlyArray< ItemId | undefined >,
	// The defaults for `page` and `perPage` are the same as in `getQueryParts`.
	{
		page = 1,
		offset,
		perPage = 10,
	}: { page?: number; offset?: number | null; perPage?: number } = {}
): ReadonlyArray< ItemId | undefined > {
	// If the query is unbounded, then `nextItemIds` is a complete replacement.
	if ( perPage === -1 ) {
		return nextItemIds;
	}

	const nextItemIdsStartIndex = offset ?? ( page - 1 ) * perPage;
	const nextItemIdsRange = Math.max( perPage, nextItemIds.length );

	// If later page has already been received, default to the larger known
	// size of the existing array, else calculate as extending the existing.
	const size = Math.max(
		itemIds.length,
		nextItemIdsStartIndex + nextItemIds.length
	);

	// Preallocate array since size is known.
	const mergedItemIds = new Array< ItemId | undefined >( size );

	for ( let i = 0; i < size; i++ ) {
		// Preserve existing item ID except for subset of range of next items.
		// We need to check against the possible maximum upper boundary because
		// a page could receive fewer than what was previously stored.
		const isInNextItemsRange =
			i >= nextItemIdsStartIndex &&
			i < nextItemIdsStartIndex + nextItemIdsRange;
		if ( isInNextItemsRange ) {
			mergedItemIds[ i ] = nextItemIds[ i - nextItemIdsStartIndex ];
		} else {
			mergedItemIds[ i ] = itemIds[ i ];
		}
	}

	return mergedItemIds;
}

/**
 * Helper function to filter out entities with certain IDs.
 * Entities are keyed by their ID.
 *
 * @param entities Entity objects, keyed by entity ID.
 * @param ids      Entity IDs to filter out.
 *
 * @return Filtered entities.
 */
function removeEntitiesById< T >(
	entities: Record< ItemId, T >,
	ids: Array< ItemId >
): Record< string, T > {
	return Object.fromEntries(
		Object.entries( entities ).filter(
			( [ id ] ) =>
				! ids.some( ( itemId ) => {
					if ( Number.isInteger( itemId ) ) {
						return itemId === +id;
					}
					return itemId === id;
				} )
		)
	);
}

/**
 * Reducer tracking items state, keyed by ID. Items are assumed to be normal,
 * where identifiers are common across all queries.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Next state.
 */
export function items(
	state: Record< string, Record< ItemId, QueriedItem > > = {},
	action: QueriedDataAction
): Record< string, Record< ItemId, QueriedItem > > {
	switch ( action.type ) {
		case 'RECEIVE_ITEMS': {
			const context = getContextFromAction( action );
			const key = action.key || DEFAULT_ENTITY_KEY;
			const itemsList = Array.isArray( action.items )
				? action.items
				: [ action.items ];
			return {
				...state,
				[ context ]: {
					...state[ context ],
					...Object.fromEntries(
						itemsList.map( ( item ) => [
							item?.[ key ],
							conservativeMapItem(
								// Items are keyed by their ID, a string or a number.
								state?.[ context ]?.[ item?.[ key ] as ItemId ],
								item
							),
						] )
					),
				},
			};
		}
		case 'REMOVE_ITEMS':
			return Object.fromEntries(
				Object.entries( state ).map( ( [ itemId, contextState ] ) => [
					itemId,
					removeEntitiesById( contextState, action.itemIds ),
				] )
			);
	}
	return state;
}

/**
 * Reducer tracking item completeness, keyed by ID. A complete item is one for
 * which all fields are known. This is used in supporting `_fields` queries,
 * where not all properties associated with an entity are necessarily returned.
 * In such cases, completeness is used as an indication of whether it would be
 * safe to use queried data for a non-`_fields`-limited request.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Next state.
 */
export function itemIsComplete(
	state: Record< string, Record< ItemId, boolean > > = {},
	action: QueriedDataAction
): Record< string, Record< ItemId, boolean > > {
	switch ( action.type ) {
		case 'RECEIVE_ITEMS': {
			const context = getContextFromAction( action );
			const { query, key = DEFAULT_ENTITY_KEY } = action;
			const itemsList = Array.isArray( action.items )
				? action.items
				: [ action.items ];

			// An item is considered complete if it is received without an associated
			// fields query. Ideally, this would be implemented in such a way where the
			// complete aggregate of all fields would satisfy completeness. Since the
			// fields are not consistent across all entities, this would require
			// introspection on the REST schema for each entity to know which fields
			// compose a complete item for that entity.
			const queryParts: Partial< QueryParts > = query
				? getQueryParts( query )
				: {};
			const isCompleteQuery =
				! query || ! Array.isArray( queryParts.fields );

			return {
				...state,
				[ context ]: {
					...state[ context ],
					...itemsList.reduce< Record< ItemId, boolean > >(
						( result, item ) => {
							// Items are keyed by their ID, a string or a number.
							const itemId = item?.[ key ] as ItemId;

							// Defer to completeness if already assigned. Technically the
							// data may be outdated if receiving items for a field subset.
							result[ itemId ] =
								state?.[ context ]?.[ itemId ] ||
								isCompleteQuery;

							return result;
						},
						{}
					),
				},
			};
		}
		case 'REMOVE_ITEMS':
			return Object.fromEntries(
				Object.entries( state ).map( ( [ itemId, contextState ] ) => [
					itemId,
					removeEntitiesById( contextState, action.itemIds ),
				] )
			);
	}

	return state;
}

/**
 * Reducer tracking queries state, keyed by stable query key. Each reducer
 * query object includes `itemIds` and `requestingPageByPerPage`.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Next state.
 */
// `compose` returns an untyped function, cast to the reducer it builds.
const receiveQueries = compose( [
	// Limit to matching action type so we don't attempt to replace action on
	// an unhandled action.
	ifMatchingAction( ( action: ReceiveItemsAction ) => 'query' in action ),

	// Inject query parts into action for use both in `keyedReducer` and reducer.
	replaceAction( ( action: ReceiveItemsAction ) => {
		// `ifMatchingAction` still passes on initialization, where state is
		// undefined and a query is not assigned. Avoid attempting to parse
		// parts. `keyedReducer` will omit by lack of `stableKey`.
		if ( action.query ) {
			return {
				...action,
				...getQueryParts( action.query ),
			};
		}

		return action;
	} ),

	keyedReducer( 'context' ),

	// Queries shape is shared, but keyed by query `stableKey` part. Original
	// reducer tracks only a single query object.
	keyedReducer( 'stableKey' ),
] )(
	(
		state: Partial< QueryState > = {},
		action: ReceiveItemsAction & Partial< QueryParts >
	): Partial< QueryState > => {
		if ( action.type !== 'RECEIVE_ITEMS' ) {
			return state;
		}

		// Single items don't have page or total count metadata
		// (only collection query responses do), so skip updating itemIds.
		if ( ! Array.isArray( action.items ) ) {
			return state;
		}

		const key = action.key ?? DEFAULT_ENTITY_KEY;

		return {
			itemIds: getMergedItemIds(
				state.itemIds,
				// Item keys are IDs, and `filter( Boolean )` drops the missing ones.
				action.items
					.map( ( item ) => item?.[ key ] )
					.filter( Boolean ) as Array< ItemId >,
				{
					page: action.page,
					offset: action.offset,
					perPage: action.perPage,
				}
			),
			meta: action.meta,
		};
	}
) as (
	state: QueriesState | undefined,
	action: ReceiveItemsAction
) => QueriesState;

/**
 * Removes items from a query's item IDs, keeping the pagination metadata in
 * sync. Every removed item the query listed was counted by the endpoint in
 * `totalItems`, so the total shrinks by that many. Nothing else refreshes the
 * totals until the next fetch, and a consumer whose page has just emptied
 * would otherwise keep requesting a page that no longer exists.
 *
 * `totalPages` can't be recomputed here — the page size that produced the
 * `X-WP-TotalPages` header isn't known to the reducer — so it is reset to
 * `null` ("unknown") rather than left next to a fresh `totalItems` it no
 * longer matches. Queries that set `per_page` are unaffected: the selectors
 * derive their page count from `totalItems` and never read the header value.
 *
 * @param queryItems   Query state, with `itemIds` and optional `meta`.
 * @param removedItems Removed item IDs, as object keys.
 *
 * @return Updated query state.
 */
function removeQueryItems(
	queryItems: QueryState,
	removedItems: Record< ItemId, boolean >
): QueryState {
	const itemIds = queryItems.itemIds.filter(
		// Holes in the list keep their place: they match no removed item.
		( itemId ) => ! removedItems[ itemId as ItemId ]
	);
	const removedCount = queryItems.itemIds.length - itemIds.length;
	if ( removedCount === 0 ) {
		return queryItems;
	}

	const nextQueryItems: QueryState = { ...queryItems, itemIds };
	if ( Number.isFinite( queryItems.meta?.totalItems ) ) {
		nextQueryItems.meta = {
			...queryItems.meta,
			totalItems: Math.max(
				0,
				// `isFinite` above is true only for a number.
				queryItems.meta!.totalItems! - removedCount
			),
			totalPages: null,
		};
	}

	return nextQueryItems;
}

/**
 * Reducer tracking queries state.
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Next state.
 */
const queries = (
	state: QueriesState = {},
	action: QueriedDataAction
): QueriesState => {
	switch ( action.type ) {
		case 'RECEIVE_ITEMS':
			return receiveQueries( state, action );
		case 'REMOVE_ITEMS':
			const removedItems = action.itemIds.reduce<
				Record< ItemId, boolean >
			>( ( result, itemId ) => {
				result[ itemId ] = true;
				return result;
			}, {} );

			return Object.fromEntries(
				Object.entries( state ).map(
					( [ queryGroup, contextQueries ] ) => [
						queryGroup,
						Object.fromEntries(
							Object.entries( contextQueries ).map(
								( [ query, queryItems ] ) => [
									query,
									removeQueryItems(
										queryItems,
										removedItems
									),
								]
							)
						),
					]
				)
			);
		default:
			return state;
	}
};

export default combineReducers( {
	items,
	itemIsComplete,
	queries,
} );
