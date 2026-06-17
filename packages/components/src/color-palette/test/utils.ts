/**
 * Internal dependencies
 */
import {
	extractColorNameFromCurrentValue,
	findSelectedColorEntry,
	normalizeColorValue,
	slugifyCustomColorName,
} from '../utils';

describe( 'ColorPalette: Utils', () => {
	describe( 'extractColorNameFromCurrentValue', () => {
		test( 'should support hex values', () => {
			const result = extractColorNameFromCurrentValue( '#00f', [
				{ name: 'Red', color: '#f00' },
				{ name: 'Blue', color: '#00f' },
			] );
			expect( result ).toBe( 'Blue' );
		} );

		test( 'should support CSS variables', () => {
			const result = extractColorNameFromCurrentValue( 'var(--blue)', [
				{ name: 'Red', color: 'var(--red)' },
				{ name: 'Blue', color: 'var(--blue)' },
			] );
			expect( result ).toBe( 'Blue' );
		} );

		test( 'should prefer selectedSlug over color matching when duplicate colors exist', () => {
			const result = extractColorNameFromCurrentValue(
				'#000',
				[
					{
						name: 'Dark Background',
						slug: 'dark-background',
						color: '#000',
					},
					{ name: 'Dark Text', slug: 'dark-text', color: '#000' },
				],
				false,
				'dark-text'
			);

			expect( result ).toBe( 'Dark Text' );
		} );
	} );

	describe( 'normalizeColorValue', () => {
		test( 'should return the value if the value argument is not a CSS variable', () => {
			const element = document.createElement( 'div' );
			expect( normalizeColorValue( '#ff0000', element ) ).toBe(
				'#ff0000'
			);
		} );
		test( 'should return the background color computed from an element if the value argument is a CSS variable', () => {
			const element = document.createElement( 'div' );
			element.style.backgroundColor = '#ff0000';
			expect( normalizeColorValue( 'var(--red)', element ) ).toBe(
				'#ff0000'
			);
		} );
		test( 'should return the background color computed from an element if the value argument is a color mix', () => {
			const element = document.createElement( 'div' );
			element.style.backgroundColor = '#ff0000';
			expect(
				normalizeColorValue(
					'color-mix(in oklab, #a71e14, white)',
					element
				)
			).toBe( '#ff0000' );
		} );
		test( 'should return the value if the value argument is undefined', () => {
			const element = document.createElement( 'div' );
			expect( normalizeColorValue( undefined, element ) ).toBe(
				undefined
			);
		} );
		test( 'should return the value if the element argument is null', () => {
			expect( normalizeColorValue( '#ff0000', null ) ).toBe( '#ff0000' );
		} );
	} );

	describe( 'slugifyCustomColorName', () => {
		test( 'kebab-cases the name and prefixes it with `custom-`', () => {
			expect( slugifyCustomColorName( 'Brand Red' ) ).toBe(
				'custom-brand-red'
			);
		} );

		test( 'normalises the name the same way WP core does for theme.json slugs', () => {
			// The slug is produced by the same `kebabCase` helper used to
			// register palette entries in `palette-edit`, so the resulting
			// CSS variable name stays in sync with whatever WordPress core
			// would emit for the same display name.
			expect( slugifyCustomColorName( 'Brand! Red?' ) ).toBe(
				'custom-brand-red'
			);
		} );

		test( 'collapses multiple separators', () => {
			expect( slugifyCustomColorName( '  Mixed--Case 123  ' ) ).toBe(
				'custom-mixed-case-123'
			);
		} );

		test( 'handles an empty name', () => {
			expect( slugifyCustomColorName( '' ) ).toBe( 'custom-' );
		} );
	} );

	describe( 'findSelectedColorEntry', () => {
		const PALETTES = [
			{
				name: 'Theme',
				slug: 'theme',
				colors: [ { name: 'Brand', slug: 'brand', color: '#0073aa' } ],
			},
			{
				name: 'Custom',
				slug: 'custom',
				colors: [
					{
						name: 'My Red',
						slug: 'custom-my-red',
						color: '#ff0000',
					},
				],
			},
		];

		test( 'returns the matching entry and its palette slug by hex', () => {
			const result = findSelectedColorEntry( '#ff0000', PALETTES );
			expect( result?.color.name ).toBe( 'My Red' );
			expect( result?.paletteSlug ).toBe( 'custom' );
		} );

		test( 'returns the matching entry by selectedSlug', () => {
			const result = findSelectedColorEntry( '#000', PALETTES, 'brand' );
			expect( result?.color.slug ).toBe( 'brand' );
			expect( result?.paletteSlug ).toBe( 'theme' );
		} );

		test( 'returns undefined when nothing matches', () => {
			expect(
				findSelectedColorEntry( '#abcdef', PALETTES )
			).toBeUndefined();
		} );
	} );
} );
