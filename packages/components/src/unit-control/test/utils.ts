/**
 * Internal dependencies
 */
import {
	filterUnitsWithSettings,
	useCustomUnits,
	getValidParsedQuantityAndUnit,
	getUnitsWithCurrentUnit,
	parseQuantityAndUnitFromRawValue,
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
					// @ts-expect-error (passing a string instead of a number is the point of the test)
					'%': '14',
					// @ts-expect-error (passing a string instead of a number is the point of the test)
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
				// @ts-expect-error (passing `false` instead of a valid array of units is the point of the test)
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

	describe( 'parseQuantityAndUnitFromRawValue', () => {
		const cases: [
			number | string | undefined,
			number | undefined,
			string | undefined,
		][] = [
			// Test undefined.
			[ undefined, undefined, undefined ],
			// Test integers and non-integers.
			[ 1, 1, undefined ],
			[ 1.25, 1.25, undefined ],
			[ '123', 123, undefined ],
			[ '1.5', 1.5, undefined ],
			[ '0.75', 0.75, undefined ],
			// Valid simple CSS values.
			[ '20px', 20, 'px' ],
			[ '0.8em', 0.8, 'em' ],
			[ '2rem', 2, 'rem' ],
			[ '1.4vw', 1.4, 'vw' ],
			[ '0.4vh', 0.4, 'vh' ],
			[ '-5px', -5, 'px' ],
			// Complex CSS values that shouldn't parse.
			[ 'abs(-15px)', undefined, undefined ],
			[ 'calc(10px + 1)', undefined, undefined ],
			[ 'clamp(2.5rem, 4vw, 3rem)', undefined, undefined ],
			[ 'max(4.5em, 3vh)', undefined, undefined ],
			[ 'min(10px, 1rem)', undefined, undefined ],
			[ 'minmax(30px, auto)', undefined, undefined ],
			[ 'var(--wp--font-size)', undefined, undefined ],
		];

		test.each( cases )(
			'given %p as argument, returns value = %p and unit = %p',
			( rawValue, expectedQuantity, expectedUnit ) => {
				const [ quantity, unit ] =
					parseQuantityAndUnitFromRawValue( rawValue );
				expect( quantity ).toBe( expectedQuantity );
				expect( unit ).toBe( expectedUnit );
			}
		);
	} );
} );
