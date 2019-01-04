/**
 * External dependencies
 */
import {
	filter,
	find,
	get,
	isEmpty,
	keyBy,
	map,
	mapValues,
	omit,
	uniqBy,
} from 'lodash';

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
	{ slug: 'reusable', title: __( 'Reusable Blocks' ) },
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
				...keyBy(
					map( action.blockTypes, ( blockType ) => omit( blockType, 'styles ' ) ),
					'name'
				),
			};
		case 'REMOVE_BLOCK_TYPES':
			return omit( state, action.names );
	}

	return state;
}

/**
 * Reducer managing the block style variations.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function blockStyles( state = {}, action ) {
	switch ( action.type ) {
		case 'ADD_BLOCK_TYPES':
			return {
				...state,
				...mapValues( keyBy( action.blockTypes, 'name' ), ( blockType ) => {
					return uniqBy( [
						...get( blockType, [ 'styles' ], [] ),
						...get( state, [ blockType.name ], [] ),
					], ( style ) => style.name );
				} ),
			};
		case 'ADD_BLOCK_STYLES':
			return {
				...state,
				[ action.blockName ]: uniqBy( [
					...get( state, [ action.blockName ], [] ),
					...( action.styles ),
				], ( style ) => style.name ),
			};
		case 'REMOVE_BLOCK_STYLES':
			return {
				...state,
				[ action.blockName ]: filter(
					get( state, [ action.blockName ], [] ),
					( style ) => action.styleNames.indexOf( style.name ) === -1,
				),
			};
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
export const freeformFallbackBlockName = createBlockNameSetterReducer( 'SET_FREEFORM_FALLBACK_BLOCK_NAME' );
export const unregisteredFallbackBlockName = createBlockNameSetterReducer( 'SET_UNREGISTERED_FALLBACK_BLOCK_NAME' );

/**
 * Reducer managing the categories
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function categories( state = DEFAULT_CATEGORIES, action ) {
	switch ( action.type ) {
		case 'SET_CATEGORIES':
			return action.categories || [];
		case 'UPDATE_CATEGORY': {
			if ( ! action.category || isEmpty( action.category ) ) {
				return state;
			}
			const categoryToChange = find( state, [ 'slug', action.slug ] );
			if ( categoryToChange ) {
				return map( state, ( category ) => {
					if ( category.slug === action.slug ) {
						return {
							...category,
							...action.category,
						};
					}
					return category;
				} );
			}
		}
	}
	return state;
}

export default combineReducers( {
	blockTypes,
	blockStyles,
	defaultBlockName,
	freeformFallbackBlockName,
	unregisteredFallbackBlockName,
	categories,
} );
