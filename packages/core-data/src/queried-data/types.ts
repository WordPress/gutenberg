/**
 * The key of a queried item, its ID by default.
 */
export type ItemId = string | number;

/**
 * A queried item, such as an entity record.
 */
export type QueriedItem = Record< string, unknown >;

/**
 * A query, as passed to the REST API.
 */
export type Query = Record< string, unknown >;

/**
 * An object of properties describing a specific query.
 */
export interface QueryParts {
	/**
	 * The query page (1-based index, default 1).
	 */
	page: number;
	/**
	 * Items per page for query (default 10).
	 */
	perPage: number;
	/**
	 * Absolute item offset (default null).
	 */
	offset: number | null;
	/**
	 * An encoded stable string of all non-pagination, non-fields query parameters.
	 */
	stableKey: string;
	/**
	 * Target subset of fields to derive from item objects (default null).
	 */
	fields: Array< string > | null;
	/**
	 * Specific item IDs to include (default null).
	 */
	include: Array< number > | null;
	/**
	 * Scope under which the request is made; determines returned fields in response.
	 */
	context: string;
}

/**
 * Pagination metadata reported by a collection response.
 */
export interface QueriedMeta {
	totalItems?: number | null;
	totalPages?: number | null;
}

/**
 * The state of one query: the IDs of its items, in order, and its metadata.
 */
export interface QueryState {
	itemIds: ReadonlyArray< ItemId | undefined >;
	meta?: QueriedMeta;
}

/**
 * The state of the queries, by context and stable query key.
 */
export type QueriesState = Record< string, Record< string, QueryState > >;

/**
 * The queried data state of an entity, with its items by context and key.
 */
export interface QueriedDataState< Item = QueriedItem > {
	items: Record< string, Record< ItemId, Item > >;
	itemIsComplete: Record< string, Record< ItemId, boolean > >;
	queries: QueriesState;
}

/**
 * Options of the queried items selectors.
 */
export interface QueriedItemsOptions {
	/**
	 * Whether the entity supports pagination. Default true.
	 */
	supportsPagination?: boolean;
}

/**
 * An action signalling that items have been received.
 */
export interface ReceiveItemsAction {
	type: 'RECEIVE_ITEMS';
	items: QueriedItem | Array< QueriedItem >;
	persistedEdits?: Record< string, unknown >;
	meta?: QueriedMeta;
	query?: Query;
	key?: string;
}

/**
 * An action signalling that items have been removed.
 */
export interface RemoveItemsAction {
	type: 'REMOVE_ITEMS';
	itemIds: Array< ItemId >;
	kind: string;
	name: string;
	invalidateCache: boolean;
}

/**
 * An action the queried data reducers handle.
 */
export type QueriedDataAction = ReceiveItemsAction | RemoveItemsAction;
