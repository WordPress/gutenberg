import type {
	ItemId,
	QueriedItem,
	QueriedMeta,
	Query,
	ReceiveItemsAction,
	RemoveItemsAction,
} from './types';

/**
 * Returns an action object used in signalling that items have been received.
 *
 * @param {Array}   items Items received.
 * @param {?Object} edits Optional edits to reset.
 * @param {?Object} meta  Meta information about pagination.
 *
 * @return {Object} Action object.
 */
export function receiveItems(
	items: QueriedItem | Array< QueriedItem >,
	edits?: Record< string, unknown >,
	meta?: QueriedMeta
): ReceiveItemsAction {
	return {
		type: 'RECEIVE_ITEMS',
		items,
		persistedEdits: edits,
		meta,
	};
}

/**
 * Returns an action object used in signalling that entity records have been
 * deleted and they need to be removed from entities state.
 *
 * @param {string}              kind            Kind of the removed entities.
 * @param {string}              name            Name of the removed entities.
 * @param {Array|number|string} records         Record IDs of the removed entities.
 * @param {boolean}             invalidateCache Controls whether we want to invalidate the cache.
 * @return {Object} Action object.
 */
export function removeItems(
	kind: string,
	name: string,
	records: ItemId | Array< ItemId >,
	invalidateCache = false
): RemoveItemsAction {
	return {
		type: 'REMOVE_ITEMS',
		itemIds: Array.isArray( records ) ? records : [ records ],
		kind,
		name,
		invalidateCache,
	};
}

/**
 * Returns an action object used in signalling that queried data has been
 * received.
 *
 * @param {Array}   items Queried items received.
 * @param {?Object} query Optional query object.
 * @param {?Object} edits Optional edits to reset.
 * @param {?Object} meta  Meta information about pagination.
 *
 * @return {Object} Action object.
 */
export function receiveQueriedItems(
	items: QueriedItem | Array< QueriedItem >,
	query: Query = {},
	edits?: Record< string, unknown >,
	meta?: QueriedMeta
): ReceiveItemsAction & { query: Query } {
	return {
		...receiveItems( items, edits, meta ),
		query,
	};
}
