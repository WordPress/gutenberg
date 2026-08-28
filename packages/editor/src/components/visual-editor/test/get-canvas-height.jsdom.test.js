import { getCanvasHeight } from '../index';

describe( 'getCanvasHeight', () => {
	it( 'fills the available height at the full container width', () => {
		expect( getCanvasHeight( 1000, { width: 1000, height: 800 } ) ).toBe(
			800
		);
	} );

	it( 'uses the target 9:16 aspect ratio at the minimum canvas width', () => {
		// 300 / ( 9 / 16 ) = 533.33, rounded to 533.
		expect( getCanvasHeight( 300, { width: 1000, height: 800 } ) ).toBe(
			533
		);
	} );

	it( 'interpolates between the container and target aspect ratios in between', () => {
		// Halfway between 300 and 1000, so halfway between the container ratio
		// ( 1.25 ) and the target ratio ( 0.5625 ): 650 / 0.90625 = 717.24.
		expect( getCanvasHeight( 650, { width: 1000, height: 800 } ) ).toBe(
			717
		);
	} );

	it( 'grows with the canvas width', () => {
		const heights = [ 300, 500, 700, 900 ].map( ( width ) =>
			getCanvasHeight( width, { width: 1000, height: 800 } )
		);
		expect( heights ).toEqual( [ 533, 659, 733, 781 ] );
	} );

	it( 'never exceeds the available height', () => {
		// In a short container, the 9:16 height of 533 is clamped to 300.
		expect( getCanvasHeight( 300, { width: 1000, height: 300 } ) ).toBe(
			300
		);
	} );

	it( 'clamps widths outside the resizable range', () => {
		// Wider than the container: the container aspect ratio applies, and the
		// height is capped at the container height.
		expect( getCanvasHeight( 1200, { width: 1000, height: 800 } ) ).toBe(
			800
		);
		// Narrower than the minimum width: the target aspect ratio applies.
		expect( getCanvasHeight( 200, { width: 1000, height: 800 } ) ).toBe(
			356
		);
	} );
} );
