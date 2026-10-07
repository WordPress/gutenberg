import { describe, expect, it } from 'vitest';
import { getCanvasConversion } from '../conversion';
import { DESIGN_WIDTH } from '../constants';

// A section rendered 600px wide is half the design width, so every measurement
// doubles on the way into design space.
const paddingBox = { left: 100, top: 50, width: 600, height: 300 };

describe( 'getCanvasConversion', () => {
	it( 'keeps the section exactly as tall as it already is', () => {
		const { canvasHeight } = getCanvasConversion( {
			paddingBox,
			children: [],
		} );

		expect( canvasHeight ).toBe( 600 );
	} );

	it( 'turns a child’s rendered box into design-space coordinates', () => {
		const { rects } = getCanvasConversion( {
			paddingBox,
			// 50px in and 30px down from the section, 300 x 60.
			children: [ { left: 150, top: 80, width: 300, height: 60 } ],
		} );

		expect( rects ).toEqual( [
			{ x: 100, y: 60, width: 600, height: 120 },
		] );
	} );

	it( 'measures every child from the section, not from the page', () => {
		const { rects } = getCanvasConversion( {
			paddingBox,
			children: [
				{ left: 100, top: 50, width: 600, height: 40 },
				{ left: 100, top: 150, width: 600, height: 40 },
			],
		} );

		expect( rects[ 0 ] ).toEqual( { x: 0, y: 0, width: 1200, height: 80 } );
		expect( rects[ 1 ].y ).toBe( 200 );
	} );

	it( 'rounds to whole design units', () => {
		const { rects } = getCanvasConversion( {
			paddingBox,
			children: [ { left: 133, top: 67, width: 101, height: 33 } ],
		} );

		expect( rects[ 0 ] ).toEqual( {
			x: 66,
			y: 34,
			width: 202,
			height: 66,
		} );
	} );

	it( 'is a no-op for a section that has not been laid out', () => {
		expect(
			getCanvasConversion( {
				paddingBox: { left: 0, top: 0, width: 0, height: 0 },
				children: [ { left: 0, top: 0, width: 10, height: 10 } ],
			} )
		).toBeNull();
	} );

	it( 'leaves a section rendered at the design width untouched', () => {
		const { canvasHeight, rects } = getCanvasConversion( {
			paddingBox: { left: 0, top: 0, width: DESIGN_WIDTH, height: 480 },
			children: [ { left: 72, top: 24, width: 1056, height: 60 } ],
		} );

		expect( canvasHeight ).toBe( 480 );
		expect( rects[ 0 ] ).toEqual( {
			x: 72,
			y: 24,
			width: 1056,
			height: 60,
		} );
	} );
} );
