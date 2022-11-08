/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * Internal dependencies
 */
import { generateShades, validateInputs } from '../color-algorithms';

describe( 'Theme color algorithms', () => {
	describe( 'validateInputs', () => {
		it( 'should allow explicitly undefined values', () => {
			validateInputs( { accent: undefined, background: undefined } );
			expect( console ).not.toHaveWarned();
		} );

		it( 'should warn if accent color is not readable against background', () => {
			validateInputs( { background: '#eee' } );
			expect( console ).not.toHaveWarned();

			validateInputs( { accent: '#000', background: '#fff' } );
			expect( console ).not.toHaveWarned();

			validateInputs( { accent: '#111', background: '#000' } );
			expect( console ).toHaveWarned();

			validateInputs( { background: '#000' } );
			expect( console ).toHaveWarned();

			// eslint-disable-next-line no-console
			expect( console.warn ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	describe( 'generateShades', () => {
		it( 'should generate the default WP shades when the default WP background/foreground colors are given', () => {
			// These should match the colors in @wordpress/base-styles
			const EXPECTED_VALUES = {
				'100': '#f0f0f0',
				'200': '#e0e0e0',
				'300': '#dddddd',
				'400': '#cccccc',
				'600': '#949494',
				'700': '#757575',
				'800': '#2f2f2f',
			};

			const shades = generateShades( '#fff', '#1e1e1e' );
			expect( shades ).toEqual( EXPECTED_VALUES );
		} );

		it.each( [
			[ '#000', '#fff' ], // wide delta
			[ '#fff', '#000' ], // flipped
			[ '#eee', '#fff' ], // narrow delta
		] )( 'should generate unique shades (bg: %s, fg: %s)', ( bg, fg ) => {
			const shades = generateShades( bg, fg );

			// The darkest and lightest shades should be different from the fg/bg colors
			expect( colord( shades[ 100 ] ).isEqual( bg ) ).toBe( false );
			expect( colord( shades[ 800 ] ).isEqual( fg ) ).toBe( false );

			// The shades should be unique
			const shadeValues = Object.values( shades );
			expect( shadeValues ).toHaveLength( new Set( shadeValues ).size );
		} );
	} );
} );
