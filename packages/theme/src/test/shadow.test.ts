import { describe, expect, it } from 'vitest';
import fallbacks from '../../prebuilt/js/design-token-fallbacks.mjs';
import { DEFAULT_SEED_COLORS } from '../color-ramps';
import { shadowTokensCSS, getShadowScale } from '../shadow';

/**
 * The token build shortens hex colors where it can (`#ffffff00` → `#fff0`),
 * so expand them before comparing.
 *
 * @param value A CSS value that may contain short hex colors.
 */
const expandHex = ( value: string ) =>
	value.replace(
		/#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?\b/gi,
		( _, r, g, b, a = 'f' ) =>
			`#${ r }${ r }${ g }${ g }${ b }${ b }${ a }${ a }`
	);

describe( 'shadow', () => {
	it( 'matches the static shadow tokens for the default background', () => {
		const staticShadowTokens = Object.entries( fallbacks )
			.filter( ( [ name ] ) => name.startsWith( '--wpds-shadow-' ) )
			.map( ( [ name, value ] ) => [ name, expandHex( value ) ] );

		expect(
			Object.fromEntries(
				shadowTokensCSS( DEFAULT_SEED_COLORS.background )
			)
		).toEqual( Object.fromEntries( staticShadowTokens ) );
	} );

	it( 'strengthens shadows as the background gets darker', () => {
		expect( getShadowScale( '#ffffff' ) ).toBe( 1 );
		expect( getShadowScale( '#bbbbbb' ) ).toBe( 1.3 );
		expect( getShadowScale( '#777777' ) ).toBe( 1.9 );
		expect( getShadowScale( '#3d3d3d' ) ).toBe( 3.2 );
	} );

	it( 'caps the scale on the darkest backgrounds', () => {
		expect( getShadowScale( '#1e1e1e' ) ).toBe( 5 );
		expect( getShadowScale( '#000000' ) ).toBe( 5 );
	} );

	it( 'caps each layer at 25% opacity', () => {
		const lg = Object.fromEntries( shadowTokensCSS( '#000000' ) )[
			'--wpds-shadow-lg'
		];
		expect( lg ).toBe(
			'0px 5px 15px #00000040, 0px 15px 27px #00000040, 0px 30px 36px #00000033, 0px 50px 43px #0000001a'
		);
	} );
} );
