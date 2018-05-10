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
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function blockTypes( state = { types: [] }, action ) {
	switch ( action.type ) {
		case 'ADD_BLOCK_TYPES':
			const addedNames = map( action.blockTypes, ( blockType ) => blockType.name );
			const previousState = filter(
				state.types,
				( blockType ) => addedNames.indexOf( blockType.name ) === -1
			);
			return {
				...state,
				types: [ ...previousState, ...action.blockTypes ],
			};
		case 'REMOVE_BLOCK_TYPES':
			return {
				...state,
				types: filter( state.types, ( blockType ) => action.names.indexOf( blockType.name ) === -1 ),
				defaultBlockType: action.names.indexOf( state.defaultBlockType ) !== -1 ? undefined : state.defaultBlockType,
				fallbackBlockType: action.names.indexOf( state.fallbackBlockType ) !== -1 ? undefined : state.fallbackBlockType,
			};
		case 'SET_DEFAULT_BLOCK_TYPE':
			return {
				...state,
				defaultBlockType: action.name,
			};
		case 'SET_FALLBACK_BLOCK_TYPE':
			return {
				...state,
				fallbackBlockType: action.name,
			};
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
	categories,
} );
