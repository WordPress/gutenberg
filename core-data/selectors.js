/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import {
	getQueriedItems,
	isRequestingQueryItems,
	hasRequestedQueryItems,
} from './queried-data';

/**
 * Returns all the available terms for the given taxonomy.
 *
 * @param {Object}  state    Data state.
 * @param {string}  taxonomy Taxonomy name.
 * @param {?Object} query    Optional terms query.
 *
 * @return {Array} Categories list.
 */
export function getTerms( state, taxonomy, query ) {
	if ( ! state.terms.hasOwnProperty( taxonomy ) ) {
		return [];
	}

	return getQueriedItems( state.terms[ taxonomy ], query );
}

/**
 * Returns all the available categories.
 *
 * @param {Object}  state Data state.
 * @param {?Object} query Optional categories query.
 *
 * @return {Array} Categories list.
 */
export function getCategories( state, query ) {
	return getTerms( state, 'categories', query );
}

/**
 * Returns true if a request is in progress for terms data of a given taxonomy,
 * or false otherwise.
 *
 * @param {Object}  state    Data state.
 * @param {string}  taxonomy Taxonomy name.
 * @param {?Object} query    Optional terms query.
 *
 * @return {boolean} Whether a request is in progress for taxonomy's terms.
 */
export function isRequestingTerms( state, taxonomy, query ) {
	if ( ! state.terms.hasOwnProperty( taxonomy ) ) {
		return false;
	}

	return isRequestingQueryItems( state.terms[ taxonomy ], query );
}

/**
 * Returns true if a request has been issued for terms data of a given
 * taxonomy, or false otherwise.
 *
 * @param {Object}  state    Data state.
 * @param {string}  taxonomy Taxonomy name.
 * @param {?Object} query    Optional terms query.
 *
 * @return {boolean} Whether a request has been issued for taxonomy's terms.
 */
export function hasRequestedTerms( state, taxonomy, query ) {
	if ( ! state.terms.hasOwnProperty( taxonomy ) ) {
		return false;
	}

	return hasRequestedQueryItems( state.terms[ taxonomy ], query );
}

/**
 * Returns true if a request is in progress for categories data, or false
 * otherwise.
 *
 * @param {Object}  state Data state.
 * @param {?Object} query Optional categories query.
 *
 * @return {boolean} Whether a request is in progress for categories.
 */
export function isRequestingCategories( state, query ) {
	return isRequestingTerms( state, 'categories', query );
}

/**
 * Returns true if a request has been issued for categories data, or false
 * otherwise.
 *
 * @param {Object}  state Data state.
 * @param {?Object} query Optional categories query.
 *
 * @return {boolean} Whether a request has been issued for categories.
 */
export function hasRequestedCategories( state, query ) {
	return hasRequestedTerms( state, 'categories', query );
}

/**
 * Returns all available authors.
 *
 * @param {Object} state Data state.
 *
 * @return {Array} Authors list.
 */
export function getAuthors( state ) {
	return getUserQueryResults( state, 'authors' );
}

/**
 * Returns all the users returned by a query ID.
 *
 * @param {Object} state   Data state.
 * @param {string} queryID Query ID.
 *
 * @return {Array} Users list.
 */
export function getUserQueryResults( state, queryID ) {
	const queryResults = state.users.queries[ queryID ];

	return map( queryResults, ( id ) => state.users.byId[ id ] );
}

/**
 * Returns the Entity's record object by key.
 *
 * @param {Object} state  State tree
 * @param {string} kind   Entity kind.
 * @param {string} name   Entity name.
 * @param {number} key    Record's key
 *
 * @return {Object?} Record.
 */
export function getEntityRecord( state, kind, name, key ) {
	return state.entities[ kind ][ name ].byKey[ key ];
}

/**
 * Return theme suports data in the index.
 *
 * @param {Object} state Data state.
 *
 * @return {*}           Index data.
 */
export function getThemeSupports( state ) {
	return state.themeSupports;
}
