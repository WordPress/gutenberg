/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Internal dependencies
 */
import {
	toggleIsRequesting,
	receiveQueriedItems,
} from './queried-data';

/**
 * Returns an action object used in signalling whether a request for a given
 * terms of a taxonomy is in progress.
 *
 * @param {string}  taxonomy     Data type requested.
 * @param {?Object} query        Optional terms query.
 * @param {boolean} isRequesting Whether a request is in progress.
 *
 * @return {Object} Action object.
 */
export function toggleIsRequestingTerms( taxonomy, query, isRequesting ) {
	return {
		...toggleIsRequesting( query, isRequesting ),
		taxonomy,
	};
}

/**
 * Returns an action object used in signalling that terms have been received
 * for a given taxonomy.
 *
 * @param {string}   taxonomy Taxonomy name.
 * @param {?Object}  query    Optional terms query.
 * @param {Object[]} terms    Terms received.
 *
 * @return {Object} Action object.
 */
export function receiveTerms( taxonomy, query, terms ) {
	return {
		...receiveQueriedItems( query, terms ),
		taxonomy,
	};
}

/**
 * Returns an action object used in signalling that authors have been received.
 *
 * @param {string}       queryID Query ID.
 * @param {Array|Object} users   Users received.
 *
 * @return {Object} Action object.
 */
export function receiveUserQuery( queryID, users ) {
	return {
		type: 'RECEIVE_USER_QUERY',
		users: castArray( users ),
		queryID,
	};
}

/**
 * Returns an action object used in signalling that entity records have been received.
 *
 * @param {string}       kind    Kind of the received entity.
 * @param {string}       name    Name of the received entity.
 * @param {Array|Object} records Recordds received.
 *
 * @return {Object} Action object.
 */
export function receiveEntityRecords( kind, name, records ) {
	return {
		type: 'RECEIVE_ENTITY_RECORDS',
		records: castArray( records ),
		kind,
		name,
	};
}

/**
 * Returns an action object used in signalling that the index has been received.
 *
 * @param {Object} index Index received.
 *
 * @return {Object} Action object.
 */
export function receiveThemeSupportsFromIndex( index ) {
	return {
		type: 'RECEIVE_THEME_SUPPORTS',
		themeSupports: index.theme_supports,
	};
}
