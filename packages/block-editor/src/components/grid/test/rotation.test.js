import { describe, expect, it } from 'vitest';
import {
	getRotatedBoundingRect,
	getRotatedOverlayStyle,
	getRotationFromPointer,
	snapAngle,
} from '../rotation';
import { getGridRectFromPixelRect, getGridTracks } from '../utils';

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

	it( 'never returns -0', () => {
		expect( Object.is( snapAngle( -0.4 ), 0 ) ).toBe( true );
		expect( Object.is( snapAngle( -360 ), 0 ) ).toBe( true );
	} );
} );

describe( 'getRotationFromPointer()', () => {
	const center = { centerX: 100, centerY: 100 };

	it( 'is 0° with the pointer straight below the center', () => {
		expect(
			getRotationFromPointer( {
				...center,
				pointerX: 100,
				pointerY: 200,
			} )
		).toBe( 0 );
	} );

	it( 'rotates clockwise as the pointer moves clockwise', () => {
		// Pointer to the left of the center: a quarter turn clockwise.
		expect(
			getRotationFromPointer( { ...center, pointerX: 0, pointerY: 100 } )
		).toBe( 90 );
		// Pointer to the right of the center: a quarter turn counterclockwise.
		expect(
			getRotationFromPointer( {
				...center,
				pointerX: 200,
				pointerY: 100,
			} )
		).toBe( -90 );
		// Pointer straight above the center: half a turn.
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

describe( 'getRotatedOverlayStyle()', () => {
	it( 'returns nothing when not rotated', () => {
		expect(
			getRotatedOverlayStyle( { width: 100, height: 50, angle: 0 } )
		).toBeUndefined();
	} );

	it( 'centers the overlay in the rotated bounding box', () => {
		// A 100x50 box rotated 90° has a 50x100 bounding box, so the overlay
		// moves 25px left and 25px down before rotating.
		expect(
			getRotatedOverlayStyle( { width: 100, height: 50, angle: 90 } )
		).toEqual( {
			transform: 'translate(-25px, 25px) rotate(90deg)',
			transformOrigin: 'center',
		} );
	} );

	it( 'keeps the overlay in place for a half turn', () => {
		expect(
			getRotatedOverlayStyle( { width: 100, height: 50, angle: 180 } )
		).toEqual( {
			transform: 'translate(0px, 0px) rotate(180deg)',
			transformOrigin: 'center',
		} );
	} );
} );

describe( 'getRotatedBoundingRect()', () => {
	// Six 100px columns and rows, without gaps.
	const tracks = getGridTracks( '100px 100px 100px 100px 100px 100px', 0 );

	function toCells( rect ) {
		const cells = getGridRectFromPixelRect( rect, tracks, tracks );
		return {
			columnStart: cells.columnStart,
			rowStart: cells.rowStart,
			columnSpan: cells.columnSpan,
			rowSpan: cells.rowSpan,
		};
	}

	it( 'returns the rectangle as it is when it is not rotated', () => {
		const rect = { left: 100, top: 200, right: 400, bottom: 300 };
		expect( getRotatedBoundingRect( rect, 0 ) ).toEqual( rect );
		expect( getRotatedBoundingRect( rect, undefined ) ).toEqual( rect );
	} );

	it( 'turns a rectangle around its center', () => {
		// 1x3 in column 2, rows 1 to 3, turned a quarter.
		const rect = getRotatedBoundingRect(
			{ left: 100, top: 0, right: 200, bottom: 300 },
			90
		);
		expect( rect.left ).toBeCloseTo( 0 );
		expect( rect.top ).toBeCloseTo( 100 );
		expect( rect.right ).toBeCloseTo( 300 );
		expect( rect.bottom ).toBeCloseTo( 200 );
		expect( toCells( rect ) ).toEqual( {
			columnStart: 1,
			rowStart: 2,
			columnSpan: 3,
			rowSpan: 1,
		} );
	} );

	it( 'covers the cells a diagonal block reaches', () => {
		// 3x1 in columns 2 to 4, row 3, at 45°: about 283px square.
		const rect = getRotatedBoundingRect(
			{ left: 100, top: 200, right: 400, bottom: 300 },
			45
		);
		expect( rect.right - rect.left ).toBeCloseTo( 282.84 );
		expect( rect.bottom - rect.top ).toBeCloseTo( 282.84 );
		expect( toCells( rect ) ).toEqual( {
			columnStart: 2,
			rowStart: 2,
			columnSpan: 3,
			rowSpan: 3,
		} );
	} );

	it( 'is the same for negative angles and angles past a half turn', () => {
		const rect = { left: 100, top: 200, right: 400, bottom: 300 };
		const rotated = getRotatedBoundingRect( rect, 30 );
		for ( const angle of [ -30, 150, -150 ] ) {
			const other = getRotatedBoundingRect( rect, angle );
			expect( other.left ).toBeCloseTo( rotated.left );
			expect( other.top ).toBeCloseTo( rotated.top );
			expect( other.right ).toBeCloseTo( rotated.right );
			expect( other.bottom ).toBeCloseTo( rotated.bottom );
		}
	} );
} );
