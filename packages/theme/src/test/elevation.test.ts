import { describe, expect, it } from 'vitest';
import fallbacks from '../../prebuilt/js/design-token-fallbacks.mjs';
import { DEFAULT_SEED_COLORS } from '../color-ramps';
import {
	elevationTokensCSS,
	getElevationOpacity,
	getHighlightOpacity,
} from '../elevation';

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

describe( 'elevation', () => {
	it( 'matches the static elevation tokens for the default background', () => {
		const staticElevationTokens = Object.entries( fallbacks )
			.filter( ( [ name ] ) => name.startsWith( '--wpds-elevation-' ) )
			.map( ( [ name, value ] ) => [ name, expandHex( value ) ] );

		expect(
			Object.fromEntries(
				elevationTokensCSS( DEFAULT_SEED_COLORS.background )
			)
		).toEqual( Object.fromEntries( staticElevationTokens ) );
	} );

	it( 'increases highlight opacity as the background gets darker', () => {
		expect( getHighlightOpacity( '#ffffff' ) ).toBe( 0 );
		expect( getHighlightOpacity( '#777777' ) ).toBe( 0.057 );
		expect( getHighlightOpacity( '#1e1e1e' ) ).toBe( 0.089 );
		expect( getHighlightOpacity( '#000000' ) ).toBe( 0.1 );
	} );

	it( 'increases shadow opacity as the background gets darker', () => {
		expect( getElevationOpacity( '#ffffff' ) ).toBe( 0.05 );
		expect( getElevationOpacity( '#777777' ) ).toBe( 0.193 );
		expect( getElevationOpacity( '#1e1e1e' ) ).toBe( 0.272 );
		expect( getElevationOpacity( '#000000' ) ).toBe( 0.3 );
	} );
} );
