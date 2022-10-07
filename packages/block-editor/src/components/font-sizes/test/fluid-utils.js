/**
 * WordPress dependencies
 */
import { logged } from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { getComputedFluidTypographyValue } from '../fluid-utils';

describe( 'getComputedFluidTypographyValue()', () => {
	afterEach( () => {
		for ( const key in logged ) {
			delete logged[ key ];
		}
	} );

	it( 'should return a fluid font size when given a min and max', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			minimumFontSize: '20px',
			maximumFontSize: '45px',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(20px, 1.25rem + ((1vw - 7.68px) * 3.005), 45px)'
		);
	} );

	it( 'should return a fluid font size when given a font size', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(22.5px, 1.40625rem + ((1vw - 7.68px) * 2.704), 45px)'
		);
	} );

	it( 'should return a fluid font size when given a min and max viewport width', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
			minimumViewPortWidth: '500px',
			maximumViewPortWidth: '1000px',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(22.5px, 1.40625rem + ((1vw - 5px) * 4.5), 45px)'
		);
	} );

	it( 'should return a fluid font size when given a scale factor', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
			scaleFactor: '2',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(22.5px, 1.40625rem + ((1vw - 7.68px) * 5.408), 45px)'
		);
	} );

	it( 'should return a fluid font size when given a min and max font size factor', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
			minimumFontSizeFactor: '0.5',
			maximumFontSizeFactor: '2',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(15px, 0.9375rem + ((1vw - 7.68px) * 5.409), 60px)'
		);
	} );
} );
