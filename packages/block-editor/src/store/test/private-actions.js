/**
 * Internal dependencies
 */
import {
	hideBlockInterface,
	showBlockInterface,
	setTemporarilyUnlockedBlock,
} from '../private-actions';

describe( 'private actions', () => {
	describe( 'hideBlockInterface', () => {
		it( 'should return the HIDE_BLOCK_INTERFACE action', () => {
			expect( hideBlockInterface() ).toEqual( {
				type: 'HIDE_BLOCK_INTERFACE',
			} );
		} );
	} );

	describe( 'showBlockInterface', () => {
		it( 'should return the SHOW_BLOCK_INTERFACE action', () => {
			expect( showBlockInterface() ).toEqual( {
				type: 'SHOW_BLOCK_INTERFACE',
			} );
		} );
	} );

	describe( 'setTemporarilyUnlockedBlock', () => {
		it( 'should return the SET_TEMPORARILY_UNLOCKED_BLOCK action', () => {
			expect(
				setTemporarilyUnlockedBlock(
					'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1'
				)
			).toEqual( {
				type: 'SET_TEMPORARILY_UNLOCKED_BLOCK',
				clientId: 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1',
			} );
		} );
	} );
} );
