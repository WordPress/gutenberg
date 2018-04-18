/**
 * External dependencies
 */
import { keyBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer managing the state of async requests keyed by request type and request id
 * The request id is in general a unique identifier generated based on the request args.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function requests( state = {}, action ) {
	switch ( action.type ) {
		case 'SET_REQUESTING':
			return {
				...state,
				[ action.dataType ]: {
					...state[ action.dataType ],
					[ action.id ]: { isRequesting: true },
				},
			};
		case 'SET_REQUESTED':
			return {
				...state,
				[ action.dataType ]: {
					...state[ action.dataType ],
					[ action.id ]: { isRequested: true, isRequesting: false },
				},
			};
	}

	return state;
}

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
 * Reducer managing post types state. Keyed by slug.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function postTypes( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_POST_TYPES':
			return {
				...state,
				...keyBy( action.postTypes, 'slug' ),
			};
	}

	return state;
}

export default combineReducers( {
	terms,
	media,
	postTypes,
	requests,
} );
