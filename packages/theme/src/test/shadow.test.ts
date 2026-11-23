import { describe, expect, it } from 'vitest';
import fallbacks from '../../prebuilt/js/design-token-fallbacks.mjs';
import { DEFAULT_SEED_COLORS } from '../color-ramps';
import { shadowTokensCSS, getShadowOpacity } from '../shadow';

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

	it( 'increases shadow opacity as the background gets darker', () => {
		expect( getShadowOpacity( '#ffffff' ) ).toBe( 0.05 );
		expect( getShadowOpacity( '#bbbbbb' ) ).toBe( 0.064 );
		expect( getShadowOpacity( '#777777' ) ).toBe( 0.093 );
		expect( getShadowOpacity( '#3d3d3d' ) ).toBe( 0.16 );
	} );

	it( 'caps shadow opacity on the darkest backgrounds', () => {
		expect( getShadowOpacity( '#1e1e1e' ) ).toBe( 0.25 );
		expect( getShadowOpacity( '#000000' ) ).toBe( 0.25 );
	} );
} );
