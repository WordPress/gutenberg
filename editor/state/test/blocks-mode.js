/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer, { getBlockMode } from '../blocks-mode';

describe( 'blocksMode', () => {
	describe( 'reducer', () => {
		it( 'should set mode to html if not set', () => {
			const action = {
				type: 'TOGGLE_BLOCK_MODE',
				uid: 'chicken',
			};
			const value = reducer( deepFreeze( {} ), action );

			expect( value ).toEqual( { chicken: 'html' } );
		} );

		it( 'should toggle mode to visual if set as html', () => {
			const action = {
				type: 'TOGGLE_BLOCK_MODE',
				uid: 'chicken',
			};
			const value = reducer( deepFreeze( { chicken: 'html' } ), action );

			expect( value ).toEqual( { chicken: 'visual' } );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getBlockMode', () => {
			it( 'should return "visual" if unset', () => {
				const state = {
					blocksMode: {},
				};

				expect( getBlockMode( state, 123 ) ).toEqual( 'visual' );
			} );

			it( 'should return the block mode', () => {
				const state = {
					blocksMode: {
						123: 'html',
					},
				};

				expect( getBlockMode( state, 123 ) ).toEqual( 'html' );
			} );
		} );
	} );
} );
