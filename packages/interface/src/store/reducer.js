/**
 * External dependencies
 */
import { flow, get, omit } from 'lodash';

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
export function singleActiveAreas( state = {}, action ) {
	if ( action.type !== 'SET_SINGLE_ACTIVE_AREA' || ! action.scope ) {
		return state;
	}
	if (
		! action.activeArea &&
		! DEFAULTS.areaControl.singleActiveAreas[ action.scope ]
	) {
		return omit( state, [ action.scope ] );
	}
	return {
		...state,
		[ action.scope ]: action.activeArea || null,
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
export function multipleActiveAreas( state = {}, action ) {
	if (
		action.type !== 'SET_MULTIPLE_ACTIVE_AREA_ENABLE_STATE' ||
		! action.scope ||
		! action.area ||
		get( state, [ action.scope, action.area ] ) === action.isEnable
	) {
		return state;
	}
	if ( action.isEnable ) {
		return {
			...state,
			[ action.scope ]: {
				...( state[ action.scope ] || {} ),
				[ action.area ]: true,
			},
		};
	}
	return {
		...state,
		[ action.scope ]: omit( state[ action.scope ] || {}, [ action.area ] ),
	};
}

const areaControl = combineReducers( {
	singleActiveAreas,
	multipleActiveAreas,
} );

export default flow( [ combineReducers, createWithInitialState( DEFAULTS ) ] )(
	{
		areaControl,
	}
);
