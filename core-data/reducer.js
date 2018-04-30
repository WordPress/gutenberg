/**
 * External dependencies
 */
import { keyBy, map, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import modelsConfig from './models';

/**
 * Reducer managing terms state. Keyed by taxonomy slug, the value is either
 * undefined (if no request has been made for given taxonomy), null (if a
 * request is in-flight for given taxonomy), or the array of terms for the
 * taxonomy.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function terms( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_TERMS':
			return {
				...state,
				[ action.taxonomy ]: action.terms,
			};

		case 'SET_REQUESTED':
			const { dataType, subType: taxonomy } = action;
			if ( dataType !== 'terms' || state.hasOwnProperty( taxonomy ) ) {
				return state;
			}

			return {
				...state,
				[ taxonomy ]: null,
			};
	}

	return state;
}

/**
 * Reducer managing authors state. Keyed by id.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function users( state = { byId: {}, queries: {} }, action ) {
	switch ( action.type ) {
		case 'RECEIVE_USER_QUERY':
			return {
				byId: {
					...state.byId,
					...keyBy( action.users, 'id' ),
				},
				queries: {
					...state.queries,
					[ action.queryID ]: map( action.users, ( user ) => user.id ),
				},
			};
	}

	return state;
}

/**
 * Reducer managing media state. Keyed by id.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function media( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_MEDIA':
			return {
				...state,
				...keyBy( action.media, 'id' ),
			};
	}

	return state;
}

/**
 * Reducer managing theme supports data.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function themeSupports( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_THEME_SUPPORTS':
			return {
				...state,
				...action.themeSupports,
			};
	}

	return state;
}

/**
 * Higher Order Reducer for a given model config. It supports:
 *
 *  - Fetching a record by primariy key
 *
 * @param {Object} modelConfig  Model config.
 *
 * @return {Function} Reducer.
 */
function model( modelConfig ) {
	return ( state = { byPrimaryKey: {} }, action ) => {
		if (
			! action.name ||
			! action.kind ||
			action.name !== modelConfig.name ||
			action.kind !== modelConfig.kind
		) {
			return state;
		}

		const primaryKey = modelConfig.primaryKey || 'id';
		switch ( action.type ) {
			case 'RECEIVE_MODEL_RECORDS':
				return {
					byPrimaryKey: {
						...state.byPrimaryKey,
						...keyBy( action.records, primaryKey ),
					},
				};
			default:
				return state;
		}
	};
}

const modelsByKind = groupBy( modelsConfig, 'kind' );
export const models = combineReducers( Object.entries( modelsByKind ).reduce( ( memo, [ kind, subModels ] ) => {
	const kindReducer = combineReducers( subModels.reduce(
		( kindMemo, modelConfig ) => ( {
			...kindMemo,
			[ modelConfig.name ]: model( modelConfig ),
		} ),
		{}
	) );

	memo[ kind ] = kindReducer;
	return memo;
}, {} ) );

export default combineReducers( {
	terms,
	users,
	media,
	themeSupports,
	models,
} );
