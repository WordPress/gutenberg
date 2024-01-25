/**
 * Internal dependencies
 */
import { hasEffectsSupport } from '../effects';

describe( 'effects', () => {
	describe( 'hasEffectsSupport', () => {
		it( 'should return false if the block does not support effects', () => {
			const settings = {
				supports: {
					shadow: false,
				},
			};

			expect( hasEffectsSupport( settings ) ).toBe( false );
		} );

		it( 'should return true if the block supports effects', () => {
			const settings = {
				supports: {
					shadow: true,
				},
			};

			expect( hasEffectsSupport( settings ) ).toBe( true );
		} );

		it( 'should return true if the block supports effects and other features', () => {
			const settings = {
				supports: {
					shadow: true,
					align: true,
				},
			};

			expect( hasEffectsSupport( settings ) ).toBe( true );
		} );
	} );
} );
