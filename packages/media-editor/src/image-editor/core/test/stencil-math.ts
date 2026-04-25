/**
 * Internal dependencies
 */
import {
	computeLockedResizeRect,
	type CropBounds,
	type ResizeDragState,
} from '../stencil-math';
import type { Size } from '../types';

const FULL_BOUNDS: CropBounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 };

describe( 'computeLockedResizeRect — driver-axis selection', () => {
	// On non-square images, the locked-ratio resize must pick the
	// driving axis based on which the user moved more in *pixel* space,
	// compared against the *pixel* aspect ratio. Comparing pixel motion
	// against the normalized w/h ratio is a unit mismatch and produces
	// the wrong axis on non-square images.
	//
	// Setup: a wide 1600×900 image, locked to a square (1:1) crop.
	// Drag from the NW corner of a (degenerate) start rect, anchored at
	// (0, 0), so distW/distH after the drag equals the drag offset.
	const imageSize: Size = { width: 1600, height: 900 };
	const aspectRatio = 1;
	// The stencil normalizes the pixel ratio for the math:
	//   normalizedRatio = aspectRatio * imageH / imageW.
	const normalizedRatio =
		( aspectRatio * imageSize.height ) / imageSize.width;
	const startRect = { x: 0, y: 0, width: 0, height: 0 };

	it( 'lets height drive when the user moves more pixels vertically than horizontally (between normalized and pixel thresholds)', () => {
		// Drag SE corner to (144px, 160px) from anchor (0, 0).
		// pixelDistW=144, pixelDistH=160, ratio=0.9 — comfortably above
		// MIN_CROP_SIZE (0.05 = 80px on a 1600px image), so neither axis
		// is at the min-clamp boundary. The ratio (0.9) sits between the
		// old buggy threshold (normalizedRatio=0.5625) and the correct
		// pixel-space threshold (aspectRatio=1) — that's the gap where
		// the unit mismatch produced the wrong driver axis.
		// Correct: 0.9 < aspectRatio(1) → height drives → 160×160 pixels.
		const drag: ResizeDragState = {
			handle: 'se',
			startX: 0,
			startY: 0,
			startRect,
		};
		const rect = computeLockedResizeRect(
			drag,
			144,
			160,
			imageSize,
			FULL_BOUNDS,
			normalizedRatio
		);

		const pixelW = rect.width * imageSize.width;
		const pixelH = rect.height * imageSize.height;

		expect( pixelW / pixelH ).toBeCloseTo( 1, 5 );
		expect( pixelH ).toBeCloseTo( 160, 5 );
		expect( pixelW ).toBeCloseTo( 160, 5 );
	} );

	it( 'returns the start rect unchanged when normalizedRatio is 0 (image not loaded)', () => {
		// Reachable in practice: keyboard arrows on a focused resize
		// handle before the image's natural size is known make the
		// stencil pass `normalizedRatio === 0`.
		const preLoadStart = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };
		const drag: ResizeDragState = {
			handle: 'se',
			startX: 0,
			startY: 0,
			startRect: preLoadStart,
		};
		const rect = computeLockedResizeRect(
			drag,
			100,
			100,
			{ width: 0, height: 0 },
			FULL_BOUNDS,
			0
		);

		expect( rect ).toEqual( preLoadStart );
	} );

	it( 'lets width drive when the user moves more pixels horizontally than vertically', () => {
		// Drag SE corner to (200px, 50px) from anchor (0, 0).
		// pixelDistW=200, pixelDistH=50, ratio=4 > aspectRatio(1).
		// Width drives. Result: 200×200 pixels.
		const drag: ResizeDragState = {
			handle: 'se',
			startX: 0,
			startY: 0,
			startRect,
		};
		const rect = computeLockedResizeRect(
			drag,
			200,
			50,
			imageSize,
			FULL_BOUNDS,
			normalizedRatio
		);

		const pixelW = rect.width * imageSize.width;
		const pixelH = rect.height * imageSize.height;

		expect( pixelW / pixelH ).toBeCloseTo( 1, 5 );
		expect( pixelW ).toBeCloseTo( 200, 5 );
		expect( pixelH ).toBeCloseTo( 200, 5 );
	} );
} );
