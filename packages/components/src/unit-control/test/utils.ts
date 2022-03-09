/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';

/**
 * Internal dependencies
 */
import {
	filterUnitsWithSettings,
	useCustomUnits,
	getValidParsedQuantityAndUnit,
	getUnitsWithCurrentUnit,
} from '../utils';
import type { WPUnitControlUnit } from '../types';

describe( 'UnitControl utils', () => {
	describe( 'useCustomUnits', () => {
		it( 'should return filtered css units', () => {
			const cssUnits = [
				{ value: 'px', label: 'pixel' },
				{ value: '%', label: 'percent' },
			];
			const units = useCustomUnits( {
				availableUnits: [ 'em', 'px' ],
				units: cssUnits,
			} );

			expect( units ).toEqual( [ { value: 'px', label: 'pixel' } ] );
		} );

		it( 'should add default values to available units', () => {
			const cssUnits = [
				{ value: 'px', label: 'pixel' },
				{ value: '%', label: 'percent' },
			];
			const units = useCustomUnits( {
				availableUnits: [ '%', 'px' ],
				defaultValues: { '%': 10, px: 10 },
				units: cssUnits,
			} );

			expect( units ).toEqual( [
				{ value: 'px', label: 'pixel', default: 10 },
				{ value: '%', label: 'percent', default: 10 },
			] );
		} );

		it( 'should add default values to available units even if the default values are strings', () => {
			// Although the public APIs of the component expect a `number` as the type of the
			// default values, it's still good to test for strings (as it can happen in un-typed
			// environments)
			const cssUnits = [
				{ value: 'px', label: 'pixel' },
				{ value: '%', label: 'percent' },
			];
			const units = useCustomUnits( {
				availableUnits: [ '%', 'px' ],
				defaultValues: {
					// @ts-ignore (passing a string instead of a number is the point of the test)
					'%': '14',
					// @ts-ignore (passing a string instead of a number is the point of the test)
					px: 'not a valid numeric quantity',
				},
				units: cssUnits,
			} );

			expect( units ).toEqual( [
				{ value: 'px', label: 'pixel', default: undefined },
				{ value: '%', label: 'percent', default: 14 },
			] );
		} );

		it( 'should return an empty array where availableUnits match no preferred css units', () => {
			const cssUnits = [
				{ value: 'em', label: 'em' },
				{ value: 'vh', label: 'vh' },
			];
			const units = useCustomUnits( {
				availableUnits: [ '%', 'px' ],
				defaultValues: { '%': 10, px: 10 },
				units: cssUnits,
			} );

			expect( units ).toHaveLength( 0 );
		} );
	} );

	describe( 'filterUnitsWithSettings', () => {
		it( 'should return filtered units array', () => {
			const preferredUnits = [ '%', 'px' ];
			const availableUnits = [
				{ value: 'px', label: 'pixel' },
				{ value: 'em', label: 'em' },
			];

			expect(
				filterUnitsWithSettings( preferredUnits, availableUnits )
			).toEqual( [ { value: 'px', label: 'pixel' } ] );
		} );

		it( 'should return empty array where preferred units match no available css unit', () => {
			const preferredUnits = [ '%', 'px' ];
			const availableUnits = [ { value: 'em', label: 'em' } ];

			expect(
				filterUnitsWithSettings( preferredUnits, availableUnits )
			).toEqual( [] );
		} );

		// Although the component's APIs and types don't allow for `false` as a value
		// unit lists, it's good to keep this test around for backwards compat.
		it( 'should return empty array where available units is set to false', () => {
			const preferredUnits = [ '%', 'px' ];
			const availableUnits = false;

			expect(
				// @ts-ignore (passing `false` instead of a valid array of units is the point of the test)
				filterUnitsWithSettings( preferredUnits, availableUnits )
			).toEqual( [] );
		} );

		it( 'should return empty array where available units is set to an empty array', () => {
			const preferredUnits = [ '%', 'px' ];
			const availableUnits: WPUnitControlUnit[] = [];

			expect(
				filterUnitsWithSettings( preferredUnits, availableUnits )
			).toEqual( [] );
		} );
	} );

	describe( 'getValidParsedQuantityAndUnit', () => {
		it( 'should parse valid number and unit', () => {
			const nextValue = '42px';

			expect( getValidParsedQuantityAndUnit( nextValue ) ).toEqual( [
				42,
				'px',
			] );
		} );

		it( 'should return next value only where no known unit parsed', () => {
			const nextValue = '365zz';

			expect( getValidParsedQuantityAndUnit( nextValue ) ).toEqual( [
				365,
				undefined,
			] );
		} );

		it( 'should return fallback value', () => {
			const nextValue = 'thirteen';
			const preferredUnits = [ { value: 'em', label: 'em' } ];
			const fallbackValue = 13;

			expect(
				getValidParsedQuantityAndUnit(
					nextValue,
					preferredUnits,
					fallbackValue
				)
			).toEqual( [ 13, 'em' ] );
		} );

		it( 'should return fallback unit', () => {
			const nextValue = '911';
			const fallbackUnit = '%';

			expect(
				getValidParsedQuantityAndUnit(
					nextValue,
					undefined,
					undefined,
					fallbackUnit
				)
			).toEqual( [ 911, '%' ] );
		} );

		it( 'should return first unit in preferred units collection as second fallback unit', () => {
			const nextValue = 101;
			const preferredUnits = [ { value: 'px', label: 'pixel' } ];

			expect(
				getValidParsedQuantityAndUnit( nextValue, preferredUnits )
			).toEqual( [ 101, 'px' ] );
		} );
	} );

	describe( 'getUnitsWithCurrentUnit', () => {
		const limitedUnits = [
			{
				value: 'px',
				label: 'px',
			},
			{
				value: 'em',
				label: 'em',
			},
		];

		it( 'should return units list with valid current unit prepended', () => {
			const result = getUnitsWithCurrentUnit(
				'20%',
				undefined,
				limitedUnits
			);

			expect( result ).toHaveLength( 3 );

			const currentUnit = result.shift();
			expect( currentUnit?.value ).toBe( '%' );
			expect( currentUnit?.label ).toBe( '%' );
			expect( result ).toEqual( limitedUnits );
		} );

		it( 'should return units list with valid current unit prepended using legacy values', () => {
			const result = getUnitsWithCurrentUnit( 20, '%', limitedUnits );

			expect( result ).toHaveLength( 3 );

			const currentUnit = result.shift();
			expect( currentUnit?.value ).toBe( '%' );
			expect( currentUnit?.label ).toBe( '%' );
			expect( result ).toEqual( limitedUnits );
		} );

		it( 'should return units list without invalid current unit prepended', () => {
			const result = getUnitsWithCurrentUnit(
				'20null',
				undefined,
				limitedUnits
			);

			expect( result ).toHaveLength( 2 );
			expect( result ).toEqual( limitedUnits );
		} );

		it( 'should return units list without an existing current unit prepended', () => {
			const result = getUnitsWithCurrentUnit(
				'20em',
				undefined,
				limitedUnits
			);

			expect( result ).toHaveLength( 2 );
			expect( result ).toEqual( limitedUnits );
		} );
	} );
} );
