/**
 * WordPress dependencies
 */
import { logged } from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import {
	getComputedFluidTypographyValue,
	getTypographyValueAndUnit,
} from '../fluid-utils';

describe( 'getComputedFluidTypographyValue()', () => {
	afterEach( () => {
		for ( const key in logged ) {
			delete logged[ key ];
		}
	} );
	it( 'should return `null` when given a font size is not a support value+unit', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize:
				'clamp(18.959px, 1.185rem + ((1vw - 3.2px) * 0.863), 30px)',
		} );
		expect( fluidTypographyValues ).toBeNull();
	} );

	it( 'should return a fluid font size when given a min and max font size', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			minimumFontSize: '20px',
			maximumFontSize: '45px',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(20px, 1.25rem + ((1vw - 3.2px) * 1.953), 45px)'
		);
	} );

	it( 'should return a fluid font size when given a font size', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(18.959px, 1.185rem + ((1vw - 3.2px) * 0.863), 30px)'
		);
	} );

	it( 'should return a fluid font size based on px when given a numerical font size', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(18.959px, 1.185rem + ((1vw - 3.2px) * 0.863), 30px)'
		);
	} );

	it( 'should return a fluid font size when given a min and max viewport width', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
			minimumViewPortWidth: '500px',
			maximumViewPortWidth: '1000px',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(18.959px, 1.185rem + ((1vw - 5px) * 2.208), 30px)'
		);
	} );

	it( 'should return a fluid font size when given a scale factor', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
			scaleFactor: '2',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(18.959px, 1.185rem + ((1vw - 3.2px) * 1.725), 30px)'
		);
	} );

	it( 'should return null when maximumViewPortWidth is not a supported value or unit', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
			maximumViewPortWidth: 'min(calc(100% - 60px), 1200px)',
		} );
		expect( fluidTypographyValues ).toBeNull();
	} );

	it( 'should return `null` font size when minimumViewPortWidth is not a supported value or unit', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '33px',
			minimumViewPortWidth: 'calc(100% - 60px)',
		} );
		expect( fluidTypographyValues ).toBeNull();
	} );
} );

describe( 'getTypographyValueAndUnit', () => {
	it( 'should return the expected return values', () => {
		[
			{
				value: null,
				expected: null,
			},
			{
				value: false,
				expected: null,
			},
			{
				value: true,
				expected: null,
			},
			{
				value: [ '10' ],
				expected: null,
			},
			{
				value: '10vh',
				expected: null,
			},
			{
				value: 'calc(2 * 10px)',
				expected: null,
			},
			{
				value: 'clamp(15px, 0.9375rem + ((1vw - 7.68px) * 5.409), 60px)',
				expected: null,
			},
			{
				value: '10',
				expected: {
					value: 10,
					unit: 'px',
				},
			},
			{
				value: 11,
				expected: {
					value: 11,
					unit: 'px',
				},
			},
			{
				value: 11.234,
				expected: {
					value: 11.234,
					unit: 'px',
				},
			},
			{
				value: '12rem',
				expected: {
					value: 12,
					unit: 'rem',
				},
			},
			{
				value: '12px',
				expected: {
					value: 12,
					unit: 'px',
				},
			},
			{
				value: '12em',
				expected: {
					value: 12,
					unit: 'em',
				},
			},
			{
				value: '12.74em',
				expected: {
					value: 12.74,
					unit: 'em',
				},
			},
		].forEach( ( { value, expected } ) => {
			expect( getTypographyValueAndUnit( value ) ).toEqual( expected );
		} );
	} );
} );
