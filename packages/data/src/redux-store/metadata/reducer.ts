/**
 * External dependencies
 */
import EquivalentKeyMap from 'equivalent-key-map';
import type { Reducer } from 'redux';

import type {
	startResolution,
	finishResolution,
	failResolution,
	startResolutions,
	finishResolutions,
	failResolutions,
	invalidateResolution,
	invalidateResolutionForStore,
	invalidateResolutionForStoreSelector,
} from './actions';

/**
 * Internal dependencies
 */
import { selectorArgsToStateKey, onSubKey } from './utils';

type Action =
	| ReturnType< typeof startResolution >
	| ReturnType< typeof finishResolution >
	| ReturnType< typeof failResolution >
	| ReturnType< typeof startResolutions >
	| ReturnType< typeof finishResolutions >
	| ReturnType< typeof failResolutions >
	| ReturnType< typeof invalidateResolution >
	| ReturnType< typeof invalidateResolutionForStore >
	| ReturnType< typeof invalidateResolutionForStoreSelector >;

type StateKey = unknown[] | unknown;
export type StateValue =
	| { status: 'resolving' | 'finished' }
	| { status: 'error'; error: Error | unknown };

export type Status = StateValue[ 'status' ];
export type State = EquivalentKeyMap< StateKey, StateValue >;

/**
 * Reducer function returning next state for selector resolution of
 * subkeys, object form:
 *
 *  selectorName -> EquivalentKeyMap<Array,boolean>
 */
const subKeysIsResolved: Reducer< Record< string, State >, Action > = onSubKey<
	State,
	Action
>( 'selectorName' )( ( state = new EquivalentKeyMap(), action: Action ) => {
	switch ( action.type ) {
		case 'START_RESOLUTION': {
			const nextState = new EquivalentKeyMap( state );
			nextState.set( selectorArgsToStateKey( action.args ), {
				status: 'resolving',
			} );
			return nextState;
		}
		case 'FINISH_RESOLUTION': {
			const nextState = new EquivalentKeyMap( state );
			nextState.set( selectorArgsToStateKey( action.args ), {
				status: 'finished',
			} );
			return nextState;
		}
		case 'FAIL_RESOLUTION': {
			const nextState = new EquivalentKeyMap( state );
			nextState.set( selectorArgsToStateKey( action.args ), {
				status: 'error',
				error: action.error,
			} );
			return nextState;
		}
		case 'START_RESOLUTIONS': {
			const nextState = new EquivalentKeyMap( state );
			for ( const resolutionArgs of action.args ) {
				nextState.set( selectorArgsToStateKey( resolutionArgs ), {
					status: 'resolving',
				} );
			}
			return nextState;
		}
		case 'FINISH_RESOLUTIONS': {
			const nextState = new EquivalentKeyMap( state );
			for ( const resolutionArgs of action.args ) {
				nextState.set( selectorArgsToStateKey( resolutionArgs ), {
					status: 'finished',
				} );
			}
			return nextState;
		}
		case 'FAIL_RESOLUTIONS': {
			const nextState = new EquivalentKeyMap( state );
			action.args.forEach( ( resolutionArgs, idx ) => {
				const resolutionState: StateValue = {
					status: 'error',
					error: undefined,
				};

				const error = action.errors[ idx ];
				if ( error ) {
					resolutionState.error = error;
				}

				nextState.set(
					selectorArgsToStateKey( resolutionArgs as unknown[] ),
					resolutionState
				);
			} );
			return nextState;
		}
		case 'INVALIDATE_RESOLUTION': {
			const nextState = new EquivalentKeyMap( state );
			nextState.delete( selectorArgsToStateKey( action.args ) );
			return nextState;
		}
	}
	return state;
} );

/**
 * Reducer function returning next state for selector resolution, object form:
 *
 *   selectorName -> EquivalentKeyMap<Array, boolean>
 *
 * @param state  Current state.
 * @param action Dispatched action.
 *
 * @return Next state.
 */
const isResolved = ( state: Record< string, State > = {}, action: Action ) => {
	switch ( action.type ) {
		case 'INVALIDATE_RESOLUTION_FOR_STORE':
			return {};
		case 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR': {
			if ( action.selectorName in state ) {
				const {
					[ action.selectorName ]: removedSelector,
					...restState
				} = state;
				return restState;
			}
			return state;
		}
		case 'START_RESOLUTION':
		case 'FINISH_RESOLUTION':
		case 'FAIL_RESOLUTION':
		case 'START_RESOLUTIONS':
		case 'FINISH_RESOLUTIONS':
		case 'FAIL_RESOLUTIONS':
		case 'INVALIDATE_RESOLUTION':
			return subKeysIsResolved( state, action );
		default:
			return state;
	}
};

export default isResolved;
