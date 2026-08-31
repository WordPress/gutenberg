import { getAvailableHighlightColors } from '../utils';

describe( 'getAvailableHighlightColors', () => {
	it( 'returns no colors when palette is empty and custom colors are disabled', () => {
		const result = getAvailableHighlightColors( {
			themeColors: [],
			defaultColors: [ { slug: 'black', color: '#000' } ],
			customColors: [],
			enableCustomColors: false,
			enableDefaultColors: false,
		} );

		expect( result.hasColorsToChoose ).toBe( false );
		expect( result.colors ).toEqual( [] );
	} );

	it( 'includes default colors when defaultPalette is enabled', () => {
		const defaults = [ { slug: 'black', color: '#000' } ];
		const result = getAvailableHighlightColors( {
			themeColors: [],
			defaultColors: defaults,
			customColors: [],
			enableCustomColors: false,
			enableDefaultColors: true,
		} );

		expect( result.hasColorsToChoose ).toBe( true );
		expect( result.colors ).toEqual( defaults );
	} );

	it( 'keeps Highlight available for custom colors when the palette is empty', () => {
		const result = getAvailableHighlightColors( {
			themeColors: [],
			defaultColors: [],
			customColors: [],
			enableCustomColors: true,
			enableDefaultColors: false,
		} );

		expect( result.hasColorsToChoose ).toBe( true );
	} );
} );
