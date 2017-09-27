/**
 * External dependencies
 */
import { combineReducers } from 'redux';
import { find, get, omit } from 'lodash';

/**
 * Reducer returning coediting enabled state.
 *
 * @param  {Boolean} state  Current state
 * @param  {Object}  action Dispatched action
 * @return {Boolean}        Updated state
 */
export const enabled = ( state = false, action ) => {
	switch ( action.type ) {
		case 'COEDITING_TOGGLE':
			return ! state;
	}
	return state;
};

/**
 * Reducer returning coedting state of peers.
 *
 * @param  {Boolean} state  Current state
 * @param  {Object}  action Dispatched action
 * @return {Boolean}        Updated state
 */
export const peers = ( state = {}, action ) => {
	const peerId = get( action, 'meta.peerId', null );

	if ( ! peerId ) {
		return state;
	}

	switch ( action.type ) {
		case 'COEDITING_CLEAR_FROZEN_BLOCK':
			if ( ! state[ peerId ] ) {
				return state;
			}

			return omit( state, peerId );
		case 'COEDITING_FREEZE_BLOCK':
			if ( state[ peerId ] === action.uid ) {
				return state;
			}

			return {
				...state,
				[ peerId ]: action.uid,
			};
	}
	return state;
};

export const reducer = combineReducers( {
	enabled,
	peers,
} );

/**
 * Returns an action object used to clear the block freeze edited by peer.
 *
 * @return {Object} Action object
 */
export function clearFrozenBlock() {
	return {
		type: 'COEDITING_CLEAR_FROZEN_BLOCK',
	};
}

/**
 * Returns an action object used to freeze the block edited by peer.
 *
 * @param  {String} uid Block unique ID
 * @return {Object}     Action object
 */
export function freezeBlock( uid ) {
	return {
		type: 'COEDITING_FREEZE_BLOCK',
		uid,
	};
}

/**
 * Returns an action object used to enable/disable a coediting session.
 *
 * @return {Object} Action object
 */
export function toggleCoediting() {
	return {
		type: 'COEDITING_TOGGLE',
	};
}

/**
 * Returns true when coediting is enabled, or false otherwise.
 *
 * @param {Object} state Global application state
 *
 * @return {Boolean}     Whether coediting is enabled
 */
export function isCoeditingEnabled( state ) {
	return get( state, 'coediting.enabled', false );
}

/**
 * Returns true when block is frozen be peer, or false otherwise.
 *
 * @param {Object} state Global application state
 * @param {String} uid   Block unique ID
 *
 * @return {Boolean}     Whether block is frozen by peer
 */
export function isBlockFrozenByPeer( state, uid ) {
	return Boolean(
		find(
			get( state, 'coediting.peers', {} ),
			( currentUid ) => currentUid === uid,
		)
	);
}
