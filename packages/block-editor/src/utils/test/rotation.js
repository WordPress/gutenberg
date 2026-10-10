import { describe, expect, it } from 'vitest';
import { fromPickerAngle, normalizeAngle, toPickerAngle } from '../rotation';

describe( 'normalizeAngle', () => {
	it( 'keeps angles that are already in range', () => {
		expect( normalizeAngle( 0 ) ).toBe( 0 );
		expect( normalizeAngle( 45 ) ).toBe( 45 );
		expect( normalizeAngle( -45 ) ).toBe( -45 );
		expect( normalizeAngle( 180 ) ).toBe( 180 );
	} );

	it( 'wraps angles into (-180, 180]', () => {
		expect( normalizeAngle( 190 ) ).toBe( -170 );
		expect( normalizeAngle( -190 ) ).toBe( 170 );
		expect( normalizeAngle( -180 ) ).toBe( 180 );
		expect( normalizeAngle( 540 ) ).toBe( 180 );
		expect( normalizeAngle( 405 ) ).toBe( 45 );
	} );

	it( 'never returns -0', () => {
		expect( Object.is( normalizeAngle( -0 ), 0 ) ).toBe( true );
		expect( Object.is( normalizeAngle( -360 ), 0 ) ).toBe( true );
	} );
} );

describe( 'toPickerAngle', () => {
	it( 'converts a stored rotation to the picker range', () => {
		expect( toPickerAngle( undefined ) ).toBe( 0 );
		expect( toPickerAngle( 0 ) ).toBe( 0 );
		expect( toPickerAngle( 45 ) ).toBe( 45 );
		expect( toPickerAngle( 180 ) ).toBe( 180 );
		expect( toPickerAngle( -90 ) ).toBe( 270 );
	} );
} );

describe( 'fromPickerAngle', () => {
	it( 'converts a picker value to a stored rotation', () => {
		expect( fromPickerAngle( 0 ) ).toBe( 0 );
		expect( fromPickerAngle( 90 ) ).toBe( 90 );
		expect( fromPickerAngle( 180 ) ).toBe( 180 );
		expect( fromPickerAngle( 270 ) ).toBe( -90 );
		expect( fromPickerAngle( 360 ) ).toBe( 0 );
	} );

	it( 'accepts strings and rounds to whole degrees', () => {
		expect( fromPickerAngle( '45' ) ).toBe( 45 );
		expect( fromPickerAngle( 12.6 ) ).toBe( 13 );
	} );

	it( 'treats values that are not numbers as no rotation', () => {
		expect( fromPickerAngle( 'abc' ) ).toBe( 0 );
		expect( fromPickerAngle( undefined ) ).toBe( 0 );
	} );
} );
