/**
 * Internal dependencies
 */
import {
	getColorsFromDuotonePreset,
	getDuotonePresetFromColors,
} from '../duotone';

describe( 'Duotone utilities', () => {
	const duotonePalette = [
		{
			name: 'Dark grayscale',
			colors: [ '#000000', '#7f7f7f' ],
			slug: 'dark-grayscale',
		},
		{
			name: 'Grayscale',
			colors: [ '#000000', '#ffffff' ],
			slug: 'grayscale',
		},
		{
			name: 'Purple and yellow',
			colors: [ '#8c00b7', '#fcff41' ],
			slug: 'purple-yellow',
		},
	];
	describe( 'getColorsFromDuotonePreset', () => {
		it( 'should return undefined if no arguments are provided', () => {
			expect( getColorsFromDuotonePreset() ).toBeUndefined();
		} );

		it( 'should return undefined if no duotone preset is provided', () => {
			expect(
				getColorsFromDuotonePreset( undefined, duotonePalette )
			).toBeUndefined();
		} );

		it( 'should return undefined if a non-existent preset is provided', () => {
			expect(
				getColorsFromDuotonePreset(
					`var:preset|duotone|does-not-exist`,
					duotonePalette
				)
			).toBeUndefined();
		} );

		it( 'should return the colors from the preset if found', () => {
			expect(
				getColorsFromDuotonePreset(
					`var:preset|duotone|${ duotonePalette[ 2 ].slug }`,
					duotonePalette
				)
			).toEqual( duotonePalette[ 2 ].colors );
		} );
	} );

	describe( 'getDuotonePresetFromColors', () => {
		it( 'should return undefined if no arguments are provided', () => {
			expect( getDuotonePresetFromColors() ).toBeUndefined();
		} );

		it( 'should return undefined if no colors are provided', () => {
			expect(
				getDuotonePresetFromColors( undefined, duotonePalette )
			).toBeUndefined();
		} );

		it( 'should return undefined if provided colors is not of valid type', () => {
			const notAnArrayOfColorStrings = 'purple-yellow';
			expect(
				getDuotonePresetFromColors(
					notAnArrayOfColorStrings,
					duotonePalette
				)
			).toBeUndefined();
		} );

		it( 'should return undefined if no duotone palette is provided', () => {
			expect(
				getDuotonePresetFromColors( [ '#8c00b7', '#fcff41' ] )
			).toBeUndefined();
		} );

		it( 'should return undefined if the provided colors do not match any preset', () => {
			expect(
				getDuotonePresetFromColors(
					[ '#000000', '#000000' ],
					duotonePalette
				)
			).toBeUndefined();
		} );

		it( 'should return the slug of the preset if found', () => {
			expect(
				getDuotonePresetFromColors(
					duotonePalette[ 2 ].colors,
					duotonePalette
				)
			).toEqual( `var:preset|duotone|${ duotonePalette[ 2 ].slug }` );
		} );
	} );
} );
