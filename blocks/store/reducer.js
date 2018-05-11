/**
 * External dependencies
 */
import { filter, map } from 'lodash';

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
 * @param {Array} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Array} Updated state.
 */
export function blockTypes( state = [], action ) {
	switch ( action.type ) {
		case 'ADD_BLOCK_TYPES':
			const addedNames = map( action.blockTypes, ( blockType ) => blockType.name );
			const previousState = filter(
				state,
				( blockType ) => addedNames.indexOf( blockType.name ) === -1
			);
			return [ ...previousState, ...action.blockTypes ];
		case 'REMOVE_BLOCK_TYPES':
			return filter( state, ( blockType ) => action.names.indexOf( blockType.name ) === -1 );
	}

	return state;
}

/**
 * Reducer keeping track of the default block type.
 *
 * @param {string?} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string?} Updated state.
 */
export function defaultBlockType( state = null, action ) {
	switch ( action.type ) {
		case 'REMOVE_BLOCK_TYPES':
			if ( action.names.indexOf( state ) !== -1 ) {
				return null;
			}
			return state;
		case 'SET_DEFAULT_BLOCK_TYPE':
			return action.name || null;
	}

	return state;
}

/**
 * Reducer keeping track of the fallback block type.
 *
 * @param {string?} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string?} Updated state.
 */
export function fallbackBlockType( state = null, action ) {
	switch ( action.type ) {
		case 'REMOVE_BLOCK_TYPES':
			if ( action.names.indexOf( state ) !== -1 ) {
				return null;
			}
			return state;
		case 'SET_FALLBACK_BLOCK_TYPE':
			return action.name || null;
	}

	return state;
}

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
	defaultBlockType,
	fallbackBlockType,
	categories,
} );
