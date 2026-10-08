import { describe, expect, it } from 'vitest';
import {
	fromPickerAngle,
	getRotatedOverlayStyle,
	getRotationFromPointer,
	normalizeAngle,
	snapAngle,
	toPickerAngle,
} from '../rotation';

describe( 'normalizeAngle()', () => {
	it( 'wraps angles into (-180, 180]', () => {
		expect( normalizeAngle( 0 ) ).toBe( 0 );
		expect( normalizeAngle( 180 ) ).toBe( 180 );
		expect( normalizeAngle( -180 ) ).toBe( 180 );
		expect( normalizeAngle( 190 ) ).toBe( -170 );
		expect( normalizeAngle( -190 ) ).toBe( 170 );
		expect( normalizeAngle( 720 ) ).toBe( 0 );
	} );

	it( 'never returns -0', () => {
		expect( Object.is( normalizeAngle( -360 ), 0 ) ).toBe( true );
	} );
} );

describe( 'snapAngle()', () => {
	it( 'snaps to multiples of 15° within 5°', () => {
		expect( snapAngle( 41 ) ).toBe( 45 );
		expect( snapAngle( 49 ) ).toBe( 45 );
		expect( snapAngle( -88 ) ).toBe( -90 );
	} );

	it( 'leaves angles outside the snap window as whole degrees', () => {
		expect( snapAngle( 37.4 ) ).toBe( 37 );
		expect( snapAngle( 52.6 ) ).toBe( 53 );
	} );

	it( 'rotates freely when snapping is off', () => {
		expect( snapAngle( 41, { snap: false } ) ).toBe( 41 );
	} );

	it( 'treats angles near 0 as 0, even without snapping', () => {
		expect( snapAngle( 1.4, { snap: false } ) ).toBe( 0 );
		expect( snapAngle( -1, { snap: false } ) ).toBe( 0 );
		expect( snapAngle( 2, { snap: false } ) ).toBe( 2 );
	} );

	it( 'wraps snapped angles at ±180', () => {
		expect( snapAngle( -178 ) ).toBe( 180 );
		expect( snapAngle( 182, { snap: false } ) ).toBe( -178 );
	} );
} );

describe( 'getRotationFromPointer()', () => {
	const center = { centerX: 100, centerY: 100 };

	it( 'is 0° with the pointer straight below the centre', () => {
		expect(
			getRotationFromPointer( {
				...center,
				pointerX: 100,
				pointerY: 200,
			} )
		).toBe( 0 );
	} );

	it( 'rotates clockwise as the pointer moves clockwise', () => {
		// Pointer to the left of the centre: a quarter turn clockwise.
		expect(
			getRotationFromPointer( { ...center, pointerX: 0, pointerY: 100 } )
		).toBe( 90 );
		// Pointer to the right of the centre: a quarter turn anticlockwise.
		expect(
			getRotationFromPointer( {
				...center,
				pointerX: 200,
				pointerY: 100,
			} )
		).toBe( -90 );
		// Pointer straight above the centre: half a turn.
		expect(
			getRotationFromPointer( { ...center, pointerX: 100, pointerY: 0 } )
		).toBe( 180 );
	} );

	it( 'snaps unless told not to', () => {
		// About 43.5° clockwise.
		const pointer = { pointerX: 5, pointerY: 200 };
		expect( getRotationFromPointer( { ...center, ...pointer } ) ).toBe(
			45
		);
		expect(
			getRotationFromPointer( { ...center, ...pointer, snap: false } )
		).toBe( 44 );
	} );
} );

describe( 'picker angle conversion', () => {
	it( 'converts stored rotation to [0, 360)', () => {
		expect( toPickerAngle( undefined ) ).toBe( 0 );
		expect( toPickerAngle( 30 ) ).toBe( 30 );
		expect( toPickerAngle( -30 ) ).toBe( 330 );
		expect( toPickerAngle( 180 ) ).toBe( 180 );
	} );

	it( 'converts picker values back to (-180, 180]', () => {
		expect( fromPickerAngle( 330 ) ).toBe( -30 );
		expect( fromPickerAngle( '45' ) ).toBe( 45 );
		expect( fromPickerAngle( 360 ) ).toBe( 0 );
		expect( fromPickerAngle( '' ) ).toBe( 0 );
	} );
} );

describe( 'getRotatedOverlayStyle()', () => {
	it( 'returns nothing when not rotated', () => {
		expect(
			getRotatedOverlayStyle( { width: 100, height: 50, angle: 0 } )
		).toBeUndefined();
	} );

	it( 'centres the overlay in the rotated bounding box', () => {
		// A 100x50 box rotated 90° has a 50x100 bounding box, so the overlay
		// moves 25px left and 25px down before rotating.
		expect(
			getRotatedOverlayStyle( { width: 100, height: 50, angle: 90 } )
		).toEqual( {
			transform: 'translate(-25px, 25px) rotate(90deg)',
			transformOrigin: 'center',
		} );
	} );
} );
