/**
 * Internal dependencies
 */
import {
	filterUnitsWithSettings,
	useCustomUnits,
	getValidParsedQuantityAndUnit,
	getUnitsWithCurrentUnit,
} from '../utils';

describe( 'UnitControl utils', () => {
	describe( 'useCustomUnits', () => {
		it( 'should return filtered css units', () => {
			const cssUnits = [ { value: 'px' }, { value: '%' } ];
			const units = useCustomUnits( {
				availableUnits: [ 'em', 'px' ],
				units: cssUnits,
			} );

			expect( units ).toEqual( [ { value: 'px' } ] );
		} );

		it( 'should add default values to available units', () => {
			const cssUnits = [ { value: 'px' }, { value: '%' } ];
			const units = useCustomUnits( {
				availableUnits: [ '%', 'px' ],
				defaultValues: { '%': 10, px: 10 },
				units: cssUnits,
			} );

			expect( units ).toEqual( [
				{ value: 'px', default: 10 },
				{ value: '%', default: 10 },
			] );
		} );

		it( 'should return an empty array where availableUnits match no preferred css units', () => {
			const cssUnits = [ { value: 'em' }, { value: 'vh' } ];
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
			const availableUnits = [ { value: 'px' }, { value: 'em' } ];

			expect(
				filterUnitsWithSettings( preferredUnits, availableUnits )
			).toEqual( [ { value: 'px' } ] );
		} );

		it( 'should return empty array where preferred units match no available css unit', () => {
			const preferredUnits = [ '%', 'px' ];
			const availableUnits = [ { value: 'em' } ];

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
				filterUnitsWithSettings( preferredUnits, availableUnits )
			).toEqual( [] );
		} );

		it( 'should return empty array where available units is set to an empty array', () => {
			const preferredUnits = [ '%', 'px' ];
			const availableUnits = [];

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
			const preferredUnits = [ { value: 'em' } ];
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
			const preferredUnits = [ { value: 'px' } ];

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
			expect( currentUnit.value ).toBe( '%' );
			expect( currentUnit.label ).toBe( '%' );
			expect( result ).toEqual( limitedUnits );
		} );

		it( 'should return units list with valid current unit prepended using legacy values', () => {
			const result = getUnitsWithCurrentUnit( 20, '%', limitedUnits );

			expect( result ).toHaveLength( 3 );

			const currentUnit = result.shift();
			expect( currentUnit.value ).toBe( '%' );
			expect( currentUnit.label ).toBe( '%' );
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
