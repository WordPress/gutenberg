/**
 * External dependencies
 */
import { flow, get, isEmpty, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { DEFAULTS } from './defaults';

/**
 * Higher-order reducer creator which provides the given initial state for the
 * original reducer.
 *
 * @param {*} initialState Initial state to provide to reducer.
 *
 * @return {Function} Higher-order reducer.
 */
const createWithInitialState = ( initialState ) => ( reducer ) => {
	return ( state = initialState, action ) => reducer( state, action );
};

/**
 * Reducer to keep tract of the active area per scope.
 *
 * @param {boolean}  state   Previous state.
 * @param {Object}   action  Action Object.
 *
 * @return {Object} Updated state.
 */
export function singleEnableItems(
	state = {},
	{ type, itemType, scope, item }
) {
	if ( type !== 'SET_SINGLE_ENABLE_ITEM' || ! itemType || ! scope ) {
		return state;
	}

	if (
		! item &&
		! get( DEFAULTS.enableItems.singleEnableItems, [ itemType, scope ] )
	) {
		const newTypeState = omit( state[ itemType ], [ scope ] );
		return isEmpty( newTypeState )
			? omit( state, [ itemType ] )
			: {
					...state,
					[ itemType ]: newTypeState,
			  };
	}
	return {
		...state,
		[ itemType ]: {
			...state[ itemType ],
			[ scope ]: item || null,
		},
	};
}

/**
 * Reducer keeping track of the "pinned" items per scope
 *
 * @param {boolean}  state   Previous state.
 * @param {Object}   action  Action Object.
 *
 * @return {Object} Updated state.
 */
export function multipleEnableItems(
	state = {},
	{ type, itemType, scope, item, isEnable }
) {
	if (
		type !== 'SET_MULTIPLE_ENABLE_ITEM' ||
		! itemType ||
		! scope ||
		! item ||
		get( state, [ itemType, scope, item ] ) === isEnable
	) {
		return state;
	}
	const currentTypeState = state[ itemType ] || {};
	const currentScopeState = currentTypeState[ scope ] || {};

	return {
		...state,
		[ itemType ]: {
			...currentTypeState,
			[ scope ]: {
				...currentScopeState,
				[ item ]: isEnable || false,
			},
		},
	};
}

const enableItems = combineReducers( {
	singleEnableItems,
	multipleEnableItems,
} );

export default flow( [ combineReducers, createWithInitialState( DEFAULTS ) ] )(
	{
		enableItems,
	}
);
