/**
 * External dependencies
 */
import { filter, map, keyBy, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Module Constants
 */
export const DEFAULT_CATEGORIES = [
	{ slug: 'common', title: __( 'Common Blocks' ) },
	{ slug: 'formatting', title: __( 'Formatting' ) },
	{ slug: 'layout', title: __( 'Layout Elements' ) },
	{ slug: 'widgets', title: __( 'Widgets' ) },
	{ slug: 'embed', title: __( 'Embeds' ) },
	{ slug: 'shared', title: __( 'Shared Blocks' ) },
];

/**
 * Reducer managing the block types
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function blockTypes( state = {}, action ) {
	switch ( action.type ) {
		case 'ADD_BLOCK_TYPES':
			return {
				...state,
				...keyBy( action.blockTypes, 'name' ),
			};
		case 'REMOVE_BLOCK_TYPES':
			return omit( state, action.names );
	}

	return state;
}

/**
 * Reducer managing the block type implementations
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function implementations( state = {}, action ) {
	switch ( action.type ) {
		case 'IMPLEMENT_BLOCK_TYPES':
			return {
				...state,
				...keyBy( action.implementations, 'name' ),
			};
		case 'REMOVE_BLOCK_TYPES':
			return omit( state, action.names );
	}

	return state;
}

/**
 * Higher-order Reducer creating a reducer keeping track of given block name.
 *
 * @param {string} setActionType  Action type.
 *
 * @return {function} Reducer.
 */
export function createBlockNameSetterReducer( setActionType ) {
	return ( state = null, action ) => {
		switch ( action.type ) {
			case 'REMOVE_BLOCK_TYPES':
				if ( action.names.indexOf( state ) !== -1 ) {
					return null;
				}
				return state;

			case setActionType:
				return action.name || null;
		}

		return state;
	};
}

export const defaultBlockName = createBlockNameSetterReducer( 'SET_DEFAULT_BLOCK_NAME' );

export const fallbackBlockName = createBlockNameSetterReducer( 'SET_FALLBACK_BLOCK_NAME' );

/**
 * Reducer managing the categories
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function categories( state = DEFAULT_CATEGORIES, action ) {
	if ( action.type === 'ADD_CATEGORIES' ) {
		const addedSlugs = map( action.categories, ( category ) => category.slug );
		const previousState = filter( state, ( category ) => addedSlugs.indexOf( category.slug ) === -1 );
		return [ ...previousState, ...action.categories ];
	}

	return state;
}

export default combineReducers( {
	blockTypes,
	implementations,
	defaultBlockName,
	fallbackBlockName,
	categories,
} );
