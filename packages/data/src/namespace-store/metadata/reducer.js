/**
 * External dependencies
 */
import { flowRight, omit, has } from 'lodash';
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * Internal dependencies
 */
import { onSubKey } from './utils';

/**
 * Reducer function returning next state for selector resolution of
 * subkeys, object form:
 *
 *  selectorName -> EquivalentKeyMap<Array,boolean>
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @returns {Object} Next state.
 */
const subKeysIsResolved = flowRight( [
	onSubKey( 'selectorName' ),
] )( ( state = new EquivalentKeyMap(), action ) => {
	switch ( action.type ) {
		case 'START_RESOLUTION':
		case 'FINISH_RESOLUTION': {
			const isStarting = action.type === 'START_RESOLUTION';
			const nextState = new EquivalentKeyMap( state );
			nextState.set( action.args, isStarting );
			return nextState;
		}
		case 'INVALIDATE_RESOLUTION': {
			const nextState = new EquivalentKeyMap( state );
			nextState.delete( action.args );
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
 * @param {Object} state   Current state.
 * @param {Object} action  Dispatched action.
 *
 * @return {Object} Next state.
 */
const isResolved = ( state = {}, action ) => {
	switch ( action.type ) {
		case 'INVALIDATE_RESOLUTION_FOR_STORE':
			return {};
		case 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR':
			return has( state, [ action.selectorName ] ) ?
				omit( state, [ action.selectorName ] ) :
				state;
		case 'START_RESOLUTION':
		case 'FINISH_RESOLUTION':
		case 'INVALIDATE_RESOLUTION':
			return subKeysIsResolved( state, action );
	}
	return state;
};

export default isResolved;
