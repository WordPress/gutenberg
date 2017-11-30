/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	clearFrozenBlock,
	enabled,
	freezeBlock,
	isBlockFrozenByPeer,
	isCoeditingEnabled,
	peers,
	toggleCoediting,
} from '../';

describe( 'coediting state', () => {
	const peerId = 'peer-id';
	const uid = 'block-uid';

	describe( 'enabled reducer', () => {
		it( 'should update to true when no previous state provided', () => {
			const state = enabled( undefined, {
				type: 'COEDITING_TOGGLE',
			} );

			expect( state ).toBe( true );
		} );

		it( 'should update to true when the previous state was false', () => {
			const state = enabled( false, {
				type: 'COEDITING_TOGGLE',
			} );

			expect( state ).toBe( true );
		} );

		it( 'should update to false when the previous state was true', () => {
			const state = enabled( true, {
				type: 'COEDITING_TOGGLE',
			} );

			expect( state ).toBe( false );
		} );
	} );

	describe( 'peers reducer', () => {
		it( 'should not update the state when no meta provided', () => {
			const initialState = deepFreeze( {} );
			const state = peers( initialState, {
				type: 'COEDITING_FREEZE_BLOCK',
				uid,
			} );

			expect( state ).toBe( initialState );
		} );

		it( 'should add a new block frozen by peer', () => {
			const initialState = deepFreeze( {} );
			const state = peers( initialState, {
				type: 'COEDITING_FREEZE_BLOCK',
				uid,
				meta: {
					peerId,
				},
			} );

			expect( state ).toEqual( {
				[ peerId ]: uid,
			} );
		} );

		it( 'should replace a block frozen by peer', () => {
			const initialState = deepFreeze( {
				[ peerId ]: uid,
			} );
			const newUid = 'new-uid';
			const state = peers( initialState, {
				type: 'COEDITING_FREEZE_BLOCK',
				uid: newUid,
				meta: {
					peerId,
				},
			} );

			expect( state ).toEqual( {
				[ peerId ]: newUid,
			} );
		} );

		it( 'should not update the state when a block was already frozen by the same peer', () => {
			const initialState = deepFreeze( {
				[ peerId ]: uid,
			} );
			const state = peers( initialState, {
				type: 'COEDITING_FREEZE_BLOCK',
				uid,
				meta: {
					peerId,
				},
			} );

			expect( state ).toBe( initialState );
		} );

		it( 'should not update the state when no frozen blocks for peer', () => {
			const initialState = deepFreeze( {} );
			const state = peers( initialState, {
				type: 'COEDITING_CLEAR_FROZEN_BLOCK',
				meta: {
					peerId,
				},
			} );

			expect( state ).toBe( initialState );
		} );

		it( 'should remove the block frozen by peer', () => {
			const initialState = deepFreeze( {
				[ peerId ]: uid,
			} );
			const state = peers( initialState, {
				type: 'COEDITING_CLEAR_FROZEN_BLOCK',
				meta: {
					peerId,
				},
			} );

			expect( state ).toEqual( {} );
		} );
	} );

	describe( 'toggleCoediting action', () => {
		it( 'should return the COEDITING_TOGGLE action', () => {
			expect( toggleCoediting() ).toEqual( {
				type: 'COEDITING_TOGGLE',
			} );
		} );
	} );

	describe( 'freezeBlock action', () => {
		it( 'should return the COEDITING_FREEZE_BLOCK action', () => {
			expect( freezeBlock( uid ) ).toEqual( {
				type: 'COEDITING_FREEZE_BLOCK',
				uid,
			} );
		} );
	} );

	describe( 'clearFrozenBlock action', () => {
		it( 'should return the COEDITING_CLEAR_FROZEN_BLOCK action', () => {
			expect( clearFrozenBlock() ).toEqual( {
				type: 'COEDITING_CLEAR_FROZEN_BLOCK',
			} );
		} );
	} );

	describe( 'isBlockFrozenByPeer', () => {
		const getInitialState = localState => deepFreeze( {
			coediting: {
				peers: localState,
			},
		} );

		it( 'should return false when no peers data', () => {
			const state = getInitialState( null );

			expect( isBlockFrozenByPeer( state, uid ) ).toBe( false );
		} );

		it( 'should return false when block is not frozen by peer', () => {
			const state = getInitialState( {
				[ peerId ]: uid,
			} );

			expect( isBlockFrozenByPeer( state, uid ) ).toBe( true );
		} );

		it( 'should return true when block is frozen by peer', () => {
			const state = getInitialState( {
				[ peerId ]: 'unknown',
			} );

			expect( isBlockFrozenByPeer( state, uid ) ).toBe( false );
		} );
	} );

	describe( 'isCoeditingEnabled', () => {
		const getInitialState = localState => deepFreeze( {
			coediting: {
				enabled: localState,
			},
		} );

		it( 'should return false when coediting is disabled', () => {
			const state = getInitialState( false );

			expect( isCoeditingEnabled( state ) ).toBe( false );
		} );

		it( 'should return true when coediting is enabled', () => {
			const state = getInitialState( true );

			expect( isCoeditingEnabled( state ) ).toBe( true );
		} );
	} );
} );
