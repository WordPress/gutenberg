/**
 * External dependencies
 */
import { castArray, find } from 'lodash';

/**
 * WordPress dependencies
 */
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import { getKindEntities } from './entities';

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

/**
 * Action generator to trigger update an entity record.
 *
 * @param {string}       kind    Kind of the received entity.
 * @param {string}       name    Name of the received entity.
 * @param {Object}       record  Records to update.
 *
 * @return {Promise} Promise of the updated post
 */
export async function* updateEntityRecord( kind, name, record ) {
	const entities = yield* getKindEntities( kind );
	const entity = find( entities, { kind, name } );
	if ( ! entity ) {
		return;
	}

	const key = entity.key || 'id';
	const updatedRecord = await apiRequest( {
		path: `${ entity.baseUrl }/${ record[ key ] }?context=edit`,
		method: 'PUT',
		data: record,
	} );
	yield receiveEntityRecords( kind, name, updatedRecord );

	return updatedRecord;
}
