/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import {
	blocks,
	clearFrozenBlocks,
	collaborators,
	enabled,
	freezeBlock,
	isBlockFrozenByCollaborator,
	isCoeditingEnabled,
	toggleCoediting,
} from '../';

describe( 'coediting state', () => {
	const collaboratorId = 'collaborator-id';
	const uid = 'block-uid';

	describe( 'blocks reducer', () => {
		it( 'should not update the state when no meta provided', () => {
			const initialState = deepFreeze( {} );
			const state = blocks( initialState, {
				type: 'COEDITING_FREEZE_BLOCK',
				uid,
			} );

			expect( state ).toBe( initialState );
		} );

		it( 'should add a new block frozen by collaborator', () => {
			const initialState = deepFreeze( {} );
			const state = blocks( initialState, {
				type: 'COEDITING_FREEZE_BLOCK',
				uid,
				meta: {
					collaboratorId,
				},
			} );

			expect( state ).toEqual( {
				[ uid ]: collaboratorId,
			} );
		} );

		it( 'should replace a block frozen by collaborator', () => {
			const initialState = deepFreeze( {
				[ uid ]: collaboratorId,
			} );
			const newUid = 'new-uid';
			const state = blocks( initialState, {
				type: 'COEDITING_FREEZE_BLOCK',
				uid: newUid,
				meta: {
					collaboratorId,
				},
			} );

			expect( state ).toEqual( {
				[ newUid ]: collaboratorId,
			} );
		} );

		it( 'should not update the state when a block was already frozen by the same collaborator', () => {
			const initialState = deepFreeze( {
				[ uid ]: collaboratorId,
			} );
			const state = blocks( initialState, {
				type: 'COEDITING_FREEZE_BLOCK',
				uid,
				meta: {
					collaboratorId,
				},
			} );

			expect( state ).toBe( initialState );
		} );

		it( 'should not update the state when no frozen blocks for collaborator', () => {
			const initialState = deepFreeze( {} );
			const state = blocks( initialState, {
				type: 'COEDITING_BLOCKS_UNFREEZE',
				meta: {
					collaboratorId,
				},
			} );

			expect( state ).toBe( initialState );
		} );

		it( 'should remove the block frozen by collaborator', () => {
			const initialState = deepFreeze( {
				[ uid ]: collaboratorId,
			} );
			const state = blocks( initialState, {
				type: 'COEDITING_BLOCKS_UNFREEZE',
				meta: {
					collaboratorId,
				},
			} );

			expect( state ).toEqual( {} );
		} );
	} );

	describe( 'collaborators reducer', () => {
		const color = 'green';
		const userId = 123;
		it( 'should add new collaborator', () => {
			const initialState = deepFreeze( {} );
			const state = collaborators( initialState, {
				type: 'COEDITING_COLLABORATOR_ADD',
				collaboratorId,
				userId,
			} );

			expect( state ).toEqual( {
				[ collaboratorId ]: {
					color: expect.any( String ),
					name: `User: ${ userId }`,
					userId,
				},
			} );
		} );

		it( 'should not update the state when trying to remove an unknown collaborator', () => {
			const initialState = deepFreeze( {
				[ collaboratorId ]: {
					color,
					name: `User: ${ userId }`,
					userId,
				},
			} );
			const unknownId = 321;
			const state = collaborators( initialState, {
				type: 'COEDITING_COLLABORATOR_REMOVE',
				collaboratorId: unknownId,
			} );

			expect( state ).toBe( initialState );
		} );

		it( 'should remove the existing collaborator', () => {
			const initialState = deepFreeze( {
				[ collaboratorId ]: {
					color,
					name: `User: ${ userId }`,
					userId,
				},
			} );
			const state = collaborators( initialState, {
				type: 'COEDITING_COLLABORATOR_REMOVE',
				collaboratorId,
			} );

			expect( state ).toEqual( {} );
		} );
	} );

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

	describe( 'clearFrozenBlocks action', () => {
		it( 'should return the COEDITING_BLOCKS_UNFREEZE action', () => {
			expect( clearFrozenBlocks() ).toEqual( {
				type: 'COEDITING_BLOCKS_UNFREEZE',
			} );
		} );
	} );

	describe( 'isBlockFrozenByCollaborator', () => {
		const getInitialState = localState => deepFreeze( {
			blocks: localState,
		} );

		it( 'should return false when no collaborators data', () => {
			const state = getInitialState( null );

			expect( isBlockFrozenByCollaborator( state, uid ) ).toBe( false );
		} );

		it( 'should return false when block is not frozen by collaborator', () => {
			const state = getInitialState( {
				[ uid ]: collaboratorId,
			} );

			expect( isBlockFrozenByCollaborator( state, uid ) ).toBe( true );
		} );

		it( 'should return true when block is frozen by collaborator', () => {
			const state = getInitialState( {
				unknown: collaboratorId,
			} );

			expect( isBlockFrozenByCollaborator( state, uid ) ).toBe( false );
		} );
	} );

	describe( 'isCoeditingEnabled', () => {
		const getInitialState = localState => deepFreeze( {
			enabled: localState,
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
