/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import getQueryParts from './get-query-parts';

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
function getRequestingPageByPerPage( state, query ) {
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
export function getQueriedItems( state, query ) {
	const { stableKey, page, perPage } = getQueryParts( query );
	if ( ! state.queries[ stableKey ] ) {
		return null;
	}

	const itemIds = state.queries[ stableKey ].itemIds;
	const startOffset = ( page - 1 ) * perPage;
	const endOffset = startOffset + perPage;

	const items = [];
	for ( let i = startOffset; i < endOffset; i++ ) {
		const itemId = itemIds[ i ];
		items.push( state.items[ itemId ] );
	}

	return items;
}

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
