import { describe, expect, it } from 'vitest';
import {
	getRotatedBoundingRect,
	getRotatedOverlayStyle,
	getRotateForState,
	getRotateValue,
	getRotationFromPointer,
	getUpdatedRotateStyle,
	normalizeAngle,
	roundAngle,
	snapAngle,
} from '../rotation';
import type { PixelRect } from '../rotation';
import {
	getGridRectFromPixelRect,
	getGridTracks,
} from '../../components/grid/utils';

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

describe( 'roundAngle', () => {
	it( 'rounds to two decimals, halves away from zero', () => {
		expect( roundAngle( 12.344 ) ).toBe( 12.34 );
		expect( roundAngle( 12.345 ) ).toBe( 12.35 );
		expect( roundAngle( -12.345 ) ).toBe( -12.35 );
		expect( roundAngle( 1.005 ) ).toBe( 1.01 );
	} );
} );

describe( 'getRotateValue', () => {
	it( 'reads the CSS angle the transform support stores, in degrees', () => {
		expect( getRotateValue( '45deg' ) ).toBe( 45 );
		expect( getRotateValue( '-90DEG' ) ).toBe( -90 );
		expect( getRotateValue( '0.25turn' ) ).toBe( 90 );
		expect( getRotateValue( '100grad' ) ).toBe( 90 );
		expect( getRotateValue( '3.14159rad' ) ).toBe( 180 );
		expect( getRotateValue( '0' ) ).toBe( 0 );
	} );

	it( 'wraps into (-180, 180] and rounds to two decimals', () => {
		expect( getRotateValue( '270deg' ) ).toBe( -90 );
		expect( getRotateValue( '12.345deg' ) ).toBe( 12.35 );
		expect( getRotateValue( 200 ) ).toBe( -160 );
	} );

	it( 'ignores anything that is not a single angle', () => {
		expect( getRotateValue( undefined ) ).toBeUndefined();
		expect( getRotateValue( '45' ) ).toBeUndefined();
		expect( getRotateValue( 'x 45deg' ) ).toBeUndefined();
		expect( getRotateValue( 'calc(45deg)' ) ).toBeUndefined();
		expect( getRotateValue( { rotate: '45deg' } ) ).toBeUndefined();
	} );
} );

describe( 'getRotateForState', () => {
	const style = {
		transform: { rotate: '30deg' },
		'@mobile': { transform: { rotate: '0deg' } },
	};

	it( 'reads the default rotation', () => {
		expect( getRotateForState( style, { viewport: 'default' } ) ).toBe(
			30
		);
		expect( getRotateForState( undefined, { viewport: 'default' } ) ).toBe(
			0
		);
	} );

	it( 'reads a viewport rotation, falling back to the default', () => {
		expect( getRotateForState( style, { viewport: '@mobile' } ) ).toBe( 0 );
		expect( getRotateForState( style, { viewport: '@tablet' } ) ).toBe(
			30
		);
	} );
} );

describe( 'getUpdatedRotateStyle', () => {
	it( 'stores the default rotation in transform.rotate, and none for 0', () => {
		expect(
			getUpdatedRotateStyle( { layout: { columnStart: 1 } }, 45, {
				viewport: 'default',
			} )
		).toEqual( {
			layout: { columnStart: 1 },
			transform: { rotate: '45deg' },
		} );
		expect(
			getUpdatedRotateStyle( { transform: { rotate: '45deg' } }, 0, {
				viewport: 'default',
			} )
		).toBeUndefined();
	} );

	it( 'keeps 0deg in a viewport state and removes the rotation for undefined', () => {
		expect(
			getUpdatedRotateStyle( { transform: { rotate: '45deg' } }, 0, {
				viewport: '@mobile',
			} )
		).toEqual( {
			transform: { rotate: '45deg' },
			'@mobile': { transform: { rotate: '0deg' } },
		} );
		expect(
			getUpdatedRotateStyle(
				{
					transform: { rotate: '45deg' },
					'@mobile': { transform: { rotate: '0deg' } },
				},
				undefined,
				{ viewport: '@mobile' }
			)
		).toEqual( { transform: { rotate: '45deg' } } );
	} );

	it( 'rotates per viewport only, so a pseudo state writes to its viewport', () => {
		expect(
			getUpdatedRotateStyle( undefined, 15, {
				viewport: '@mobile',
				pseudo: ':hover',
			} )
		).toEqual( { '@mobile': { transform: { rotate: '15deg' } } } );
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

	it( 'adds the offset and keeps the result in range', () => {
		const left = { pointerX: 0, pointerY: 100 };
		expect(
			getRotationFromPointer( { ...center, ...left, offset: -60 } )
		).toBe( 30 );
		// 90° + 120° is 210°, which is -150°.
		expect(
			getRotationFromPointer( { ...center, ...left, offset: 120 } )
		).toBe( -150 );
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

	function toCells( rect: PixelRect ) {
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
