/**
 * Internal dependencies
 */
import { getCustomDuotoneFlags } from '../filters-panel';

describe( 'getCustomDuotoneFlags', () => {
	it( 'enables custom duotone when custom color and duotone are enabled', () => {
		const settings = {
			color: {
				custom: true,
				customDuotone: true,
			},
		};

		expect( getCustomDuotoneFlags( settings, [] ) ).toEqual( {
			disableCustomColors: false,
			disableCustomDuotone: false,
		} );
	} );

	it( 'disables custom duotone when custom duotone is disabled', () => {
		const settings = {
			color: {
				custom: true,
				customDuotone: false,
			},
		};

		expect(
			getCustomDuotoneFlags( settings, [ { slug: 'blue' } ] )
		).toEqual( {
			disableCustomColors: false,
			disableCustomDuotone: true,
		} );
	} );

	it( 'disables custom duotone when both custom colors and palette are unavailable', () => {
		const settings = {
			color: {
				custom: false,
				customDuotone: true,
			},
		};

		expect( getCustomDuotoneFlags( settings, [] ) ).toEqual( {
			disableCustomColors: true,
			disableCustomDuotone: true,
		} );
	} );

	it( 'allows custom duotone when custom colors are disabled but palette exists', () => {
		const settings = {
			color: {
				custom: false,
				customDuotone: true,
			},
		};

		expect(
			getCustomDuotoneFlags( settings, [ { slug: 'brand' } ] )
		).toEqual( {
			disableCustomColors: true,
			disableCustomDuotone: false,
		} );
	} );

	it( 'disables custom duotone when explicitly disabled by the caller', () => {
		const settings = {
			color: {
				custom: true,
				customDuotone: true,
			},
		};

		expect(
			getCustomDuotoneFlags( settings, [ { slug: 'brand' } ], false )
		).toEqual( {
			disableCustomColors: false,
			disableCustomDuotone: true,
		} );
	} );
} );
