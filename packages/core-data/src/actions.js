/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Given an apiFetch payload, returns an action object used in signalling that
 * an API request should be issued. This can be used in tandem with the data
 * module's `controls` option for asynchronous API request logic flows.
 *
 * @param {Object} options apiFetch options payload.
 *
 * @return {Object} Action object.
 */
export function fetchFromAPI( options ) {
	return {
		type: 'FETCH_FROM_API',
		...options,
	};
}

/**
 * Returns an action object used in signalling that terms have been received
 * for a given taxonomy.
 *
 * @param {string}   taxonomy Taxonomy name.
 * @param {Object[]} terms    Terms received.
 *
 * @return {Object} Action object.
 */
export function receiveTerms( taxonomy, terms ) {
	return {
		type: 'RECEIVE_TERMS',
		taxonomy,
		terms,
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
 * Returns an action object used in adding new entities.
 *
 * @param {Array} entities  Entities received.
 *
 * @return {Object} Action object.
 */
export function addEntities( entities ) {
	return {
		type: 'ADD_ENTITIES',
		entities,
	};
}

/**
 * Returns an action object used in signalling that entity records have been received.
 *
 * @param {string}       kind    Kind of the received entity.
 * @param {string}       name    Name of the received entity.
 * @param {Array|Object} records Records received.
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
