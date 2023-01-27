/**
 * External dependencies
 */
/**
 * Internal dependencies
 */
import {
	__experimentalHideBlockInterface as hideBlockInterface,
	__experimentalShowBlockInterface as showBlockInterface,
} from '../private-actions';

describe( 'private actions', () => {
	describe( 'hideBlockInterface', () => {
		it( 'should return the HIDE_BLOCK_INTERFACE action', () => {
			expect( hideBlockInterface() ).toEqual( {
				type: '__experimental_HIDE_BLOCK_INTERFACE',
			} );
		} );
	} );

	describe( 'showBlockInterface', () => {
		it( 'should return the SHOW_BLOCK_INTERFACE action', () => {
			expect( showBlockInterface() ).toEqual( {
				type: '__experimental_SHOW_BLOCK_INTERFACE',
			} );
		} );
	} );
} );
