/**
 * External dependencies
 */
import { keyBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

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

/**
 * Reducer managing user post types capabilties state. Keyed by post type.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function userPostTypeCapabilities( state = {}, action ) {
	switch ( action.type ) {
		case 'RECEIVE_USER_POST_TYPE_CAPABILITIES':
			return {
				...state,
				[ action.postTypeSlug ]: action.capabilities,
			};
	}

	return state;
}

export default combineReducers( {
	terms,
	media,
	postTypes,
	userPostTypeCapabilities,
} );
