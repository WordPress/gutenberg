/**
 * Internal dependencies
 */
import {
	filterUnitsWithSettings,
	useCustomUnits,
	getValidParsedUnit,
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

		it( 'should return `false` where availableUnits match no preferred css units', () => {
			const cssUnits = [ { value: 'em' }, { value: 'vh' } ];
			const units = useCustomUnits( {
				availableUnits: [ '%', 'px' ],
				defaultValues: { '%': 10, px: 10 },
				units: cssUnits,
			} );

			expect( units ).toBe( false );
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
	} );

	describe( 'getValidParsedUnit', () => {
		it( 'should parse valid number and unit', () => {
			const nextValue = '42px';

			expect( getValidParsedUnit( nextValue ) ).toEqual( [ 42, 'px' ] );
		} );

		it( 'should return next value only where no known unit parsed', () => {
			const nextValue = '365zz';

			expect( getValidParsedUnit( nextValue ) ).toEqual( [
				365,
				undefined,
			] );
		} );

		it( 'should return fallback value', () => {
			const nextValue = 'thirteen';
			const preferredUnits = [ { value: 'em' } ];
			const fallbackValue = 13;

			expect(
				getValidParsedUnit( nextValue, preferredUnits, fallbackValue )
			).toEqual( [ 13, 'em' ] );
		} );

		it( 'should return fallback unit', () => {
			const nextValue = '911';
			const fallbackUnit = '%';

			expect(
				getValidParsedUnit(
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

			expect( getValidParsedUnit( nextValue, preferredUnits ) ).toEqual( [
				101,
				'px',
			] );
		} );
	} );
} );
