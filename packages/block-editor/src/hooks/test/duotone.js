/**
 * Internal dependencies
 */
import { getColorsFromDuotonePreset } from '../duotone';

describe( 'getColorsFromDuotonePreset', () => {
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
			getColorsFromDuotonePreset( 'does-not-exist', duotonePalette )
		).toBeUndefined();
	} );
} );
