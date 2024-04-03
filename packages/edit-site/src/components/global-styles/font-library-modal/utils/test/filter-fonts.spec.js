/**
 * Internal dependencies
 */
import filterFonts from '../filter-fonts';

describe( 'filterFonts', () => {
	const mockFonts = [
		{
			font_family_settings: { name: 'Arial' },
			categories: [ 'sans-serif' ],
		},
		{
			font_family_settings: { name: 'Arial Condensed' },
			categories: [ 'sans-serif' ],
		},
		{
			font_family_settings: { name: 'Times New Roman' },
			categories: [ 'serif' ],
		},
		{
			font_family_settings: { name: 'Courier New' },
			categories: [ 'monospace' ],
		},
		{
			font_family_settings: { name: 'Romantic' },
			categories: [ 'cursive' ],
		},
	];

	it( 'should return all fonts if no filters are provided', () => {
		const result = filterFonts( mockFonts, {} );
		expect( result ).toEqual( mockFonts );
	} );

	it( 'should filter by category', () => {
		const result = filterFonts( mockFonts, { category: 'serif' } );
		expect( result ).toEqual( [
			{
				font_family_settings: { name: 'Times New Roman' },
				categories: [ 'serif' ],
			},
		] );
	} );

	it( 'should return all fonts if category is "all"', () => {
		const result = filterFonts( mockFonts, { category: 'all' } );
		expect( result ).toEqual( mockFonts );
	} );

	it( 'should filter by search', () => {
		const result = filterFonts( mockFonts, { search: 'ari' } );
		expect( result ).toEqual( [
			{
				font_family_settings: { name: 'Arial' },
				categories: [ 'sans-serif' ],
			},
			{
				font_family_settings: { name: 'Arial Condensed' },
				categories: [ 'sans-serif' ],
			},
		] );
	} );

	it( 'should be case insensitive when filtering by search', () => {
		const result = filterFonts( mockFonts, { search: 'RoMANtic' } );
		expect( result ).toEqual( [
			{
				font_family_settings: { name: 'Romantic' },
				categories: [ 'cursive' ],
			},
		] );
	} );

	it( 'should filter by both category and search', () => {
		const result = filterFonts( mockFonts, {
			category: 'serif',
			search: 'Times',
		} );
		expect( result ).toEqual( [
			{
				font_family_settings: { name: 'Times New Roman' },
				categories: [ 'serif' ],
			},
		] );
	} );

	it( 'should return an empty array if no fonts match the filter criteria', () => {
		const result = filterFonts( mockFonts, {
			category: 'serif',
			search: 'Arial',
		} );
		expect( result ).toEqual( [] );
	} );

	it( 'should return an empty array if fonts array is not provided', () => {
		const result = filterFonts( undefined, { category: 'serif' } );
		expect( result ).toEqual( [] );
	} );
} );
