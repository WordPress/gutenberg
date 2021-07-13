/**
 * Internal dependencies
 */
import { filterUnitsWithSettings, useCustomUnits } from '../utils';

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
} );
