/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Internal dependencies
 */
import { getRequestId } from './utils';

/**
 * Returns an action object used in signalling that the request for a given
 * data type has been made.
 *
 * @param {string}  dataType Data type requested.
 * @param {*} query          Optional request args.
 *
 * @return {Object} Action object.
 */
export function setRequested( dataType, query ) {
	return {
		type: 'SET_REQUESTED',
		id: getRequestId( query ),
		dataType,
	};
}

/**
 * Returns an action object used in signalling that the request for a given
 * data type has been triggered.
 *
 * @param {string}  dataType Data type requested.
 * @param {*} query          Optional request args.
 *
 * @return {Object} Action object.
 */
export function setRequesting( dataType, query ) {
	return {
		type: 'SET_REQUESTING',
		id: getRequestId( query ),
		dataType,
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
 * Returns an action object used in signalling that post types have been received.
 *
 * @param {Array|Object} postTypes Post Types received.
 *
 * @return {Object} Action object.
 */
export function receivePostTypes( postTypes ) {
	return {
		type: 'RECEIVE_POST_TYPES',
		postTypes: castArray( postTypes ),
	};
}
