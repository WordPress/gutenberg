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

	it( 'should return a fluid font size when given a min and max font size', () => {
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
			'clamp(22.5px, 1.406rem + ((1vw - 7.68px) * 0.901), 30px)'
		);
	} );

	it( 'should return a fluid font size based on px when given a numerical font size', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(22.5px, 1.406rem + ((1vw - 7.68px) * 0.901), 30px)'
		);
	} );

	it( 'should return a fluid font size when given a min and max viewport width', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
			minimumViewPortWidth: '500px',
			maximumViewPortWidth: '1000px',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(22.5px, 1.406rem + ((1vw - 5px) * 1.5), 30px)'
		);
	} );

	it( 'should return a fluid font size when given a scale factor', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
			scaleFactor: '2',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(22.5px, 1.406rem + ((1vw - 7.68px) * 1.803), 30px)'
		);
	} );

	it( 'should return a fluid font size when given a min and max font size factor', () => {
		const fluidTypographyValues = getComputedFluidTypographyValue( {
			fontSize: '30px',
			minimumFontSizeFactor: '0.5',
			maximumFontSizeFactor: '2',
		} );
		expect( fluidTypographyValues ).toBe(
			'clamp(15px, 0.938rem + ((1vw - 7.68px) * 1.803), 30px)'
		);
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
				expect( getTypographyValueAndUnit( value ) ).toEqual(
					expected
				);
			} );
		} );
	} );
} );
