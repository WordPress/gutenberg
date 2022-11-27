/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * Internal dependencies
 */
import { COLORS } from '../../utils';

/**
 * Internal dependencies
 */
import { generateShades, generateThemeVariables } from '../color-algorithms';

describe( 'Theme color algorithms', () => {
	describe( 'generateThemeVariables', () => {
		it( 'should allow explicitly undefined values', () => {
			generateThemeVariables( {
				accent: undefined,
				background: undefined,
			} );
			expect( console ).not.toHaveWarned();
		} );

		it( 'should warn if invalid colors are passed', () => {
			generateThemeVariables( { accent: 'var(--invalid)' } );
			expect( console ).toHaveWarned();
		} );

		it( 'should warn if standard foreground colors are not readable against background', () => {
			generateThemeVariables( { background: '#777' } );
			expect( console ).toHaveWarnedWith(
				'wp.components.Theme: The background color provided ("#777") does not have sufficient contrast against the standard foreground colors.'
			);
		} );

		it( 'should warn if accent color is not readable against background', () => {
			generateThemeVariables( { background: '#fefefe' } );
			expect( console ).not.toHaveWarned();

			generateThemeVariables( {
				accent: '#000',
				background: '#fff',
			} );
			expect( console ).not.toHaveWarned();

			generateThemeVariables( {
				accent: '#111',
				background: '#000',
			} );
			expect( console ).toHaveWarnedWith(
				'wp.components.Theme: The background color ("#000") does not have sufficient contrast against the accent color ("#111").'
			);

			generateThemeVariables( { background: '#eee' } );
			expect( console ).toHaveWarnedWith(
				'wp.components.Theme: The background color ("#eee") does not have sufficient contrast against the accent color ("#007cba").'
			);
		} );

		it( 'should warn if a readable grayscale cannot be generated', () => {
			generateThemeVariables( { background: '#ddd' } );
			expect( console ).toHaveWarnedWith(
				'wp.components.Theme: The background color provided ("#ddd") cannot generate a set of grayscale foreground colors with sufficient contrast. Try adjusting the color to be lighter or darker.'
			);
		} );
	} );

	describe( 'generateShades', () => {
		it( 'should generate the default WP shades when the default WP background/foreground colors are given', () => {
			const shades = generateShades( '#fff', '#1e1e1e' );

			Object.entries( shades ).forEach( ( [ k, color ] ) => {
				const key = parseInt( k, 10 ) as keyof typeof shades;
				const normalizedExpectedColor = colord(
					COLORS.gray[ key ]
				).toHex();

				expect( color ).toBe( normalizedExpectedColor );
			} );
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
