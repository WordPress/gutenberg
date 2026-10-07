/**
 * Internal dependencies
 */
import filterFonts from '../filter-fonts';

const mockFonts = [
	{
		font_family_settings: {
			name: 'Roboto',
			slug: 'roboto',
		},
		categories: [ 'sans-serif' ],
	},
	{
		font_family_settings: {
			name: 'Open Sans',
			slug: 'open-sans',
		},
		categories: [ 'sans-serif' ],
	},
	{
		font_family_settings: {
			name: 'Lora',
			slug: 'lora',
		},
		categories: [ 'serif' ],
	},
];

describe( 'filterFonts', () => {
	it( 'should return all fonts when no filters are provided', () => {
		const result = filterFonts( mockFonts, {} );
		expect( result ).toEqual( mockFonts );
	} );

	it( 'should filter by search term', () => {
		const result = filterFonts( mockFonts, { search: 'roboto' } );
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].font_family_settings.name ).toBe( 'Roboto' );
	} );

	it( 'should filter by search term with trailing space', () => {
		const result = filterFonts( mockFonts, { search: 'Roboto ' } );
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].font_family_settings.name ).toBe( 'Roboto' );
	} );

	it( 'should filter by search term with leading space', () => {
		const result = filterFonts( mockFonts, { search: ' Roboto' } );
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].font_family_settings.name ).toBe( 'Roboto' );
	} );

	it( 'should filter by search term with leading and trailing spaces', () => {
		const result = filterFonts( mockFonts, { search: ' Open Sans ' } );
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].font_family_settings.name ).toBe( 'Open Sans' );
	} );

	it( 'should filter by category', () => {
		const result = filterFonts( mockFonts, { category: 'serif' } );
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].font_family_settings.name ).toBe( 'Lora' );
	} );

	it( 'should return all fonts when category is "all"', () => {
		const result = filterFonts( mockFonts, { category: 'all' } );
		expect( result ).toEqual( mockFonts );
	} );
} );
