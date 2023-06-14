/**
 * Internal dependencies
 */
import {
	hideBlockInterface,
	showBlockInterface,
	setBlockEditingMode,
	unsetBlockEditingMode,
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

	describe( 'setBlockEditingMode', () => {
		it( 'should return the SET_BLOCK_EDITING_MODE action', () => {
			expect(
				setBlockEditingMode(
					'14501cc2-90a6-4f52-aa36-ab6e896135d1',
					'default'
				)
			).toEqual( {
				type: 'SET_BLOCK_EDITING_MODE',
				clientId: '14501cc2-90a6-4f52-aa36-ab6e896135d1',
				mode: 'default',
			} );
		} );
	} );

	describe( 'unsetBlockEditingMode', () => {
		it( 'should return the UNSET_BLOCK_EDITING_MODE action', () => {
			expect(
				unsetBlockEditingMode( '14501cc2-90a6-4f52-aa36-ab6e896135d1' )
			).toEqual( {
				type: 'UNSET_BLOCK_EDITING_MODE',
				clientId: '14501cc2-90a6-4f52-aa36-ab6e896135d1',
			} );
		} );
	} );
} );
