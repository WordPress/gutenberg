/**
 * External dependencies
 */
import { filter, map, keyBy, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	SUGGESTED_PANEL,
	SHARED_PANEL,
} from '../api/inserter_menu';

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
	switch ( action.type ) {
		case 'ADD_CATEGORIES':
			const addedSlugs = map( action.categories, ( category ) => category.slug );
			const previousState = filter( state, ( category ) => addedSlugs.indexOf( category.slug ) === -1 );
			return [ ...previousState, ...action.categories ];
		/*
		 * @frontkom/gutenberg 0.1.4
		 */
		case 'REMOVE_CATEGORIES':
			const nextState = filter( state, ( category ) => action.categories.indexOf( category.slug ) === -1 );
			return [ ...nextState ];
	}

	return state;
}

/*
 * @frontkom/gutenberg 0.1.4
 */
const defaultInserterMenuPanels = { [ SUGGESTED_PANEL ]: true, [ SHARED_PANEL ]: true };

/**
 * Reducer managing the inserter menu panels
 * @since  @frontkom/gutenberg 0.1.4
 * @param  {Object} state  Current state.
 * @param  {Object} action Dispatched action.
 * @return {Object}        Updated state.
 */
export function inserterMenuPanels( state = defaultInserterMenuPanels, action ) {
	switch ( action.type ) {
		case 'HIDE_INSERTER_MENU_PANEL':
			return { 
				...state,
				[ action.slug ]: false,
			};
		case 'SHOW_INSERTER_MENU_PANEL':
			return { 
				...state,
				[ action.slug ]: true,
			};
	}

	return state;
}

export default combineReducers( {
	blockTypes,
	defaultBlockName,
	fallbackBlockName,
	categories,
	inserterMenuPanels,
} );
