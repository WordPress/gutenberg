/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Returns an action object used in signalling that the request for a given
 * data type has been made.
 *
 * @param {string}  dataType Data type requested.
 * @param {?string} subType  Optional data sub-type.
 *
 * @return {Object} Action object.
 */
export function setRequested( dataType, subType ) {
	return {
		type: 'SET_REQUESTED',
		dataType,
		subType,
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
 * Returns an action object used in signalling that media have been received.
 *
 * @param {Array|Object} media Media received.
 *
 * @return {Object} Action object.
 */
export function receiveMedia( media ) {
	return {
		type: 'RECEIVE_MEDIA',
		media: castArray( media ),
	};
}

/**
 * Returns an action object used in signalling that model records have been received.
 *
 * @param {string}       kind    Kind of the received model.
 * @param {string}       name    Name of the received model.
 * @param {Array|Object} records Recordds received.
 *
 * @return {Object} Action object.
 */
export function receiveModelRecords( kind, name, records ) {
	return {
		type: 'RECEIVE_MODEL_RECORDS',
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
