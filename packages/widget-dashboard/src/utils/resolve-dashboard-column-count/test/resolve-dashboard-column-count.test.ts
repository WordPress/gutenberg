import { describe, expect, it } from 'vitest';
import {
	resolveDashboardColumns,
	resolveDashboardMinColumnWidth,
} from '../resolve-dashboard-column-count';

describe( 'resolveDashboardColumns', () => {
	it( 'leaves the count unset when the host sets nothing', () => {
		expect( resolveDashboardColumns( undefined ) ).toBeUndefined();
	} );

	it( 'floors a count at one with no ceiling', () => {
		expect( resolveDashboardColumns( 3 ) ).toBe( 3 );
		expect( resolveDashboardColumns( 12 ) ).toBe( 12 );
		expect( resolveDashboardColumns( 2.7 ) ).toBe( 2 );
		expect( resolveDashboardColumns( 0 ) ).toBe( 1 );
		expect( resolveDashboardColumns( -4 ) ).toBe( 1 );
	} );

	it( 'treats a non-finite count as unset', () => {
		expect( resolveDashboardColumns( Number.NaN ) ).toBeUndefined();
		expect(
			resolveDashboardColumns( Number.POSITIVE_INFINITY )
		).toBeUndefined();
	} );

	it( 'keeps steps keyed by container width, each floored at one', () => {
		expect( resolveDashboardColumns( { 0: 1, 600: 2.5, 960: 4 } ) ).toEqual(
			{ 0: 1, 600: 2, 960: 4 }
		);
		expect( resolveDashboardColumns( { 600: 0 } ) ).toEqual( { 600: 1 } );
	} );

	it( 'keeps an auto step when a floor is set', () => {
		expect( resolveDashboardColumns( { 0: 1, 960: 'auto' }, 240 ) ).toEqual(
			{ 0: 1, 960: 'auto' }
		);
	} );

	it( 'drops auto steps when no floor is set', () => {
		expect( resolveDashboardColumns( { 0: 1, 960: 'auto' } ) ).toEqual( {
			0: 1,
		} );
		expect( resolveDashboardColumns( { 0: 'auto' } ) ).toBeUndefined();
		expect( resolveDashboardColumns( { 0: 'auto' }, 0 ) ).toBeUndefined();
	} );

	it( 'drops step entries that are not finite widths and counts', () => {
		expect(
			resolveDashboardColumns( {
				0: 1,
				'-10': 3,
				wide: 4,
				960: Number.NaN,
			} as unknown as Record< number, number > )
		).toEqual( { 0: 1 } );
	} );

	it( 'treats an empty map or a non-object as unset', () => {
		expect( resolveDashboardColumns( {} ) ).toBeUndefined();
		expect(
			resolveDashboardColumns( { wide: 4 } as unknown as Record<
				number,
				number
			> )
		).toBeUndefined();
		expect(
			resolveDashboardColumns( '4' as unknown as number )
		).toBeUndefined();
	} );
} );

describe( 'resolveDashboardMinColumnWidth', () => {
	it( 'keeps a positive floor as asked', () => {
		expect( resolveDashboardMinColumnWidth( 240 ) ).toBe( 240 );
	} );

	it( 'leaves the floor unset when the host sets nothing', () => {
		expect( resolveDashboardMinColumnWidth( undefined ) ).toBeUndefined();
	} );

	it( 'treats a non-positive or non-finite floor as unset', () => {
		expect( resolveDashboardMinColumnWidth( 0 ) ).toBeUndefined();
		expect( resolveDashboardMinColumnWidth( -240 ) ).toBeUndefined();
		expect( resolveDashboardMinColumnWidth( Number.NaN ) ).toBeUndefined();
		expect(
			resolveDashboardMinColumnWidth( Number.POSITIVE_INFINITY )
		).toBeUndefined();
	} );
} );
