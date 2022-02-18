/**
 * External dependencies
 */
import { omit, has } from 'lodash';
import EquivalentKeyMap from 'equivalent-key-map';
import type { Reducer } from 'redux';

/**
 * Internal dependencies
 */
import { normalizeArgs, onSubKey } from './utils';

type Action =
	| ReturnType< typeof import('./actions').startResolution >
	| ReturnType< typeof import('./actions').finishResolution >
	| ReturnType< typeof import('./actions').startResolutions >
	| ReturnType< typeof import('./actions').finishResolutions >
	| ReturnType< typeof import('./actions').invalidateResolution >
	| ReturnType< typeof import('./actions').invalidateResolutionForStore >
	| ReturnType<
			typeof import('./actions').invalidateResolutionForStoreSelector
	  >;

export type State = EquivalentKeyMap< unknown[] | unknown, boolean >;

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
		case 'START_RESOLUTION':
		case 'FINISH_RESOLUTION': {
			const isStarting = action.type === 'START_RESOLUTION';
			const nextState = new EquivalentKeyMap( state );
			nextState.set( normalizeArgs( action.args ), isStarting );
			return nextState;
		}
		case 'START_RESOLUTIONS':
		case 'FINISH_RESOLUTIONS': {
			const isStarting = action.type === 'START_RESOLUTIONS';
			const nextState = new EquivalentKeyMap( state );
			for ( const resolutionArgs of action.args ) {
				nextState.set( normalizeArgs( resolutionArgs ), isStarting );
			}
			return nextState;
		}
		case 'INVALIDATE_RESOLUTION': {
			const nextState = new EquivalentKeyMap( state );
			nextState.delete( normalizeArgs( action.args ) );
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
 * @param  state  Current state.
 * @param  action Dispatched action.
 *
 * @return Next state.
 */
const isResolved = ( state: Record< string, State > = {}, action: Action ) => {
	switch ( action.type ) {
		case 'INVALIDATE_RESOLUTION_FOR_STORE':
			return {};
		case 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR':
			return has( state, [ action.selectorName ] )
				? omit( state, [ action.selectorName ] )
				: state;
		case 'START_RESOLUTION':
		case 'FINISH_RESOLUTION':
		case 'START_RESOLUTIONS':
		case 'FINISH_RESOLUTIONS':
		case 'INVALIDATE_RESOLUTION':
			return subKeysIsResolved( state, action );
	}
	return state;
};

export default isResolved;
