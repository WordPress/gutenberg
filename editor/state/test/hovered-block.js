/**
 * Internal dependencies
 */
import reducer, { isBlockHovered } from '../hovered-block';

describe( 'hoveredBlock', () => {
	describe( 'reducer', () => {
		it( 'should return with block uid as hovered', () => {
			const state = reducer( null, {
				type: 'TOGGLE_BLOCK_HOVERED',
				uid: 'kumquat',
				hovered: true,
			} );

			expect( state ).toBe( 'kumquat' );
		} );

		it( 'should return null when a block is selected', () => {
			const state = reducer( 'kumquat', {
				type: 'SELECT_BLOCK',
				uid: 'kumquat',
			} );

			expect( state ).toBeNull();
		} );

		it( 'should replace the hovered block', () => {
			const state = reducer( 'chicken', {
				type: 'REPLACE_BLOCKS',
				uids: [ 'chicken' ],
				blocks: [ {
					uid: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( state ).toBe( 'wings' );
		} );

		it( 'should keep the hovered block', () => {
			const state = reducer( 'chicken', {
				type: 'REPLACE_BLOCKS',
				uids: [ 'ribs' ],
				blocks: [ {
					uid: 'wings',
					name: 'core/freeform',
				} ],
			} );

			expect( state ).toBe( 'chicken' );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isBlockHovered', () => {
			it( 'should return true if the block is hovered', () => {
				const state = {
					hoveredBlock: 123,
				};

				expect( isBlockHovered( state, 123 ) ).toBe( true );
			} );

			it( 'should return false if the block is not hovered', () => {
				const state = {
					hoveredBlock: 123,
				};

				expect( isBlockHovered( state, 23 ) ).toBe( false );
			} );
		} );
	} );
} );
