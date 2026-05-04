/**
 * Internal dependencies
 */
import { pxToValueDelta, clampValue, applyZeroSnap } from '../use-ruler-drag';

describe( 'rotation-ruler math', () => {
	describe( 'pxToValueDelta', () => {
		it( 'converts pointer delta to a value delta using pixelsPerStep × step', () => {
			// 60px / 6 px-per-step × 1° step = 10 steps.
			// Negative because dragging the ruler right exposes smaller values.
			expect( pxToValueDelta( 60, 6, 1 ) ).toBeCloseTo( -10 );
			expect( pxToValueDelta( -60, 6, 1 ) ).toBeCloseTo( 10 );
		} );

		it( 'scales with a custom step', () => {
			// 60px / 6 px-per-step × 0.5° step = 5°.
			expect( pxToValueDelta( -60, 6, 0.5 ) ).toBeCloseTo( 5 );
		} );
	} );

	describe( 'clampValue', () => {
		it( 'clamps to [min, max]', () => {
			expect( clampValue( 100, -45, 45 ) ).toBe( 45 );
			expect( clampValue( -100, -45, 45 ) ).toBe( -45 );
			expect( clampValue( 12.3, -45, 45 ) ).toBe( 12.3 );
		} );
	} );

	describe( 'applyZeroSnap', () => {
		it( 'snaps to 0 only when entering the window from outside', () => {
			// previous outside window, next inside window → snap to 0.
			expect( applyZeroSnap( 0.4, 1.2, 0.75 ) ).toBe( 0 );
		} );

		it( 'does not snap when previous value was already inside the window', () => {
			// already at 0; small drag should produce a non-zero value.
			expect( applyZeroSnap( 0.4, 0, 0.75 ) ).toBe( 0.4 );
		} );

		it( 'does not snap when next value is outside the window', () => {
			expect( applyZeroSnap( 1.5, 5, 0.75 ) ).toBe( 1.5 );
		} );

		it( 'is a no-op when window is 0', () => {
			expect( applyZeroSnap( 0.1, 5, 0 ) ).toBe( 0.1 );
		} );
	} );
} );
