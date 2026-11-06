import { describe, expect, it } from 'vitest';
import {
	MAX_CUSTOM_FONT_SIZE,
	MIN_CUSTOM_FONT_SIZE,
	clampCustomFontSize,
	getFontDisplayName,
	parseFontSizeToPx,
	resolveBlockTypography,
} from '../utils';

const FONT_FAMILIES = [
	{
		slug: 'display',
		name: 'Bricolage Grotesque',
		fontFamily: '"Bricolage Grotesque", sans-serif',
	},
	{
		slug: 'body',
		name: 'Instrument Sans',
		fontFamily: '"Instrument Sans", sans-serif',
	},
];

describe( 'parseFontSizeToPx', () => {
	it( 'reads px, rem, em and bare numbers', () => {
		expect( parseFontSizeToPx( '24px' ) ).toBe( 24 );
		expect( parseFontSizeToPx( '1.5rem' ) ).toBe( 24 );
		expect( parseFontSizeToPx( '1.5em' ) ).toBe( 24 );
		expect( parseFontSizeToPx( 24 ) ).toBe( 24 );
		expect( parseFontSizeToPx( '24' ) ).toBe( 24 );
	} );

	it( 'gives up on values it cannot measure', () => {
		expect(
			parseFontSizeToPx( 'clamp(1rem, 1rem + 2vw, 2rem)' )
		).toBeUndefined();
		expect( parseFontSizeToPx( '50%' ) ).toBeUndefined();
		expect( parseFontSizeToPx( undefined ) ).toBeUndefined();
		expect( parseFontSizeToPx( '' ) ).toBeUndefined();
	} );
} );

describe( 'clampCustomFontSize', () => {
	it( 'keeps a size within the range the toolbar offers', () => {
		expect( clampCustomFontSize( '32' ) ).toBe( 32 );
		expect( clampCustomFontSize( 32 ) ).toBe( 32 );
		expect( clampCustomFontSize( '32px' ) ).toBe( 32 );
		expect( clampCustomFontSize( 2 ) ).toBe( MIN_CUSTOM_FONT_SIZE );
		expect( clampCustomFontSize( 999 ) ).toBe( MAX_CUSTOM_FONT_SIZE );
	} );

	it( 'rounds to whole pixels', () => {
		expect( clampCustomFontSize( '32.6' ) ).toBe( 33 );
	} );

	it( 'rejects anything that is not a size', () => {
		expect( clampCustomFontSize( 'large' ) ).toBeUndefined();
		expect( clampCustomFontSize( '' ) ).toBeUndefined();
		expect( clampCustomFontSize( undefined ) ).toBeUndefined();
		expect( clampCustomFontSize( NaN ) ).toBeUndefined();
	} );
} );

const GLOBAL_STYLES = {
	styles: {
		typography: {
			fontFamily: '"Instrument Sans", sans-serif',
			fontSize: '17px',
		},
		elements: {
			h2: {
				typography: {
					fontFamily: '"Bricolage Grotesque", sans-serif',
					fontSize: '40px',
				},
			},
		},
		blocks: {
			'core/quote': {
				typography: { fontFamily: '"Newsreader", serif' },
			},
		},
	},
};

describe( 'resolveBlockTypography', () => {
	it( 'reads a heading from the element its level renders as', () => {
		expect(
			resolveBlockTypography( GLOBAL_STYLES, 'core/heading', {
				level: 2,
			} )
		).toEqual( {
			fontFamily: '"Bricolage Grotesque", sans-serif',
			fontSize: '40px',
		} );
	} );

	it( 'falls back to the root for a level the theme leaves alone', () => {
		expect(
			resolveBlockTypography( GLOBAL_STYLES, 'core/heading', {
				level: 6,
			} )
		).toEqual( {
			fontFamily: '"Instrument Sans", sans-serif',
			fontSize: '17px',
		} );
	} );

	it( 'reads each property from the most specific place it is set', () => {
		// The quote sets only a font, so its size comes from the root.
		expect( resolveBlockTypography( GLOBAL_STYLES, 'core/quote' ) ).toEqual(
			{
				fontFamily: '"Newsreader", serif',
				fontSize: '17px',
			}
		);
	} );

	it( 'reads a block the theme says nothing about from the root', () => {
		expect(
			resolveBlockTypography( GLOBAL_STYLES, 'core/paragraph' )
		).toEqual( {
			fontFamily: '"Instrument Sans", sans-serif',
			fontSize: '17px',
		} );
	} );
} );

describe( 'getFontDisplayName', () => {
	it( 'uses the preset\u2019s name when the font is one', () => {
		expect(
			getFontDisplayName(
				'"Bricolage Grotesque", sans-serif',
				FONT_FAMILIES
			)
		).toBe( 'Bricolage Grotesque' );
	} );

	it( 'reads the first family of a stack the theme sets itself', () => {
		expect( getFontDisplayName( '"Newsreader", serif', [] ) ).toBe(
			'Newsreader'
		);
		expect( getFontDisplayName( 'Georgia, serif', [] ) ).toBe( 'Georgia' );
		expect(
			getFontDisplayName( "'IBM Plex Mono', monospace", undefined )
		).toBe( 'IBM Plex Mono' );
	} );

	it( 'has nothing to say about a font it was not given', () => {
		expect(
			getFontDisplayName( undefined, FONT_FAMILIES )
		).toBeUndefined();
		expect( getFontDisplayName( '', FONT_FAMILIES ) ).toBeUndefined();
	} );
} );
