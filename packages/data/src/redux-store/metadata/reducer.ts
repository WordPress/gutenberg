/**
 * External dependencies
 */
import { omit, has } from 'lodash';
import EquivalentKeyMap from 'equivalent-key-map';
import type { Reducer } from 'redux';

/**
 * Internal dependencies
 */
// @ts-ignore
import { combineReducers } from '../../';
import { onSubKey } from './utils';

type Action =
	| ReturnType< typeof import('./actions').startResolution >
	| ReturnType< typeof import('./actions').finishResolution >
	| ReturnType< typeof import('./actions').failResolution >
	| ReturnType< typeof import('./actions').startResolutions >
	| ReturnType< typeof import('./actions').finishResolutions >
	| ReturnType< typeof import('./actions').failResolutions >
	| ReturnType< typeof import('./actions').invalidateResolution >
	| ReturnType< typeof import('./actions').invalidateResolutionForStore >
	| ReturnType<
			typeof import('./actions').invalidateResolutionForStoreSelector
	  >;

type StateKey = unknown[] | unknown;
export type ResolutionState = EquivalentKeyMap< StateKey, boolean | undefined >;
export type ErrorState = EquivalentKeyMap<
	StateKey,
	{ error: Error | null } | undefined
>;

/**
 * Reducer function returning next state for selector resolution, object form:
 *
 *   selectorName -> EquivalentKeyMap<Array, boolean>
 *
 * @param  state  Current state.
 * @param  action Dispatched action.
 *
 * @return Next state.
 */
const isResolvingReducer = (
	state: Record< string, ResolutionState > = {},
	action: Action
) => {
	switch ( action.type ) {
		case 'INVALIDATE_RESOLUTION_FOR_STORE':
			return {};
		case 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR':
			return has( state, [ action.selectorName ] )
				? omit( state, [ action.selectorName ] )
				: state;
		case 'START_RESOLUTION':
		case 'FINISH_RESOLUTION':
		case 'FAIL_RESOLUTION':
		case 'START_RESOLUTIONS':
		case 'FINISH_RESOLUTIONS':
		case 'FAIL_RESOLUTIONS':
		case 'INVALIDATE_RESOLUTION':
			return subKeysIsResolved( state, action );
	}
	return state;
};

/**
 * Reducer function returning next state for selector resolution of
 * subkeys, object form:
 *
 *  selectorName -> EquivalentKeyMap<Array,boolean>
 */
const subKeysIsResolved: Reducer<
	Record< string, ResolutionState >,
	Action
> = onSubKey< ResolutionState, Action >( 'selectorName' )(
	( state = new EquivalentKeyMap(), action: Action ) => {
		switch ( action.type ) {
			case 'FAIL_RESOLUTION':
			case 'START_RESOLUTION':
			case 'FINISH_RESOLUTION': {
				const isResolving = action.type === 'START_RESOLUTION';
				const nextState = new EquivalentKeyMap( state );
				nextState.set( action.args, isResolving );
				return nextState;
			}
			case 'FAIL_RESOLUTIONS':
			case 'START_RESOLUTIONS':
			case 'FINISH_RESOLUTIONS': {
				const isResolving = action.type === 'START_RESOLUTIONS';
				const nextState = new EquivalentKeyMap( state );
				for ( const resolutionArgs of action.args ) {
					nextState.set( resolutionArgs, isResolving );
				}
				return nextState;
			}
			case 'INVALIDATE_RESOLUTION': {
				const nextState = new EquivalentKeyMap( state );
				nextState.delete( action.args );
				return nextState;
			}
		}
		return state;
	}
);

/**
 * Reducer function returning next state for selector resolution, object form:
 *
 *   selectorName -> EquivalentKeyMap<Array, boolean>
 *
 * @param  state  Current state.
 * @param  action Dispatched action.
 *
 * @return Next state.
 */
const hasError = (
	state: Record< string, ErrorState > = {},
	action: Action
) => {
	switch ( action.type ) {
		case 'INVALIDATE_RESOLUTION_FOR_STORE':
			return {};
		case 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR':
			return has( state, [ action.selectorName ] )
				? omit( state, [ action.selectorName ] )
				: state;
		case 'START_RESOLUTION':
		case 'FINISH_RESOLUTION':
		case 'FAIL_RESOLUTION':
		case 'START_RESOLUTIONS':
		case 'FINISH_RESOLUTIONS':
		case 'FAIL_RESOLUTIONS':
		case 'INVALIDATE_RESOLUTION':
			return subKeysHasError( state, action );
	}
	return state;
};

/**
 * Reducer function returning next state for selector resolution of
 * subkeys, object form:
 *
 *  selectorName -> EquivalentKeyMap<Array,boolean>
 */
const subKeysHasError: Reducer<
	Record< string, ErrorState >,
	Action
> = onSubKey< ErrorState, Action >( 'selectorName' )(
	( state = new EquivalentKeyMap(), action: Action ) => {
		switch ( action.type ) {
			case 'FAIL_RESOLUTION': {
				const nextState = new EquivalentKeyMap( state );
				nextState.set( action.args, {
					error: action.error,
				} );
				return nextState;
			}
			case 'FAIL_RESOLUTIONS': {
				const nextState = new EquivalentKeyMap( state );
				for ( const idx in action.args ) {
					const resolutionArgs = action.args[ idx ];
					const error = action.errors[ idx ];
					if ( error ) {
						nextState.set( resolutionArgs, { error } );
					}
				}
				return nextState;
			}
			case 'START_RESOLUTION':
			case 'FINISH_RESOLUTION':
			case 'INVALIDATE_RESOLUTION': {
				const nextState = new EquivalentKeyMap( state );
				nextState.delete( action.args );
				return nextState;
			}
		}
		return state;
	}
);

export default combineReducers( { isResolving: isResolvingReducer, hasError } );
