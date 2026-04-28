/**
 * Internal dependencies
 */
import {
	computeLockedResizeRect,
	computeShiftLockedResizeRect,
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

const IMAGE: Size = { width: 1000, height: 500 };

const START_RECT = { x: 0.2, y: 0.2, width: 0.4, height: 0.6 };

function makeDrag(
	handle: ResizeDragState[ 'handle' ],
	startX = 500,
	startY = 250
): ResizeDragState {
	return {
		handle,
		startX,
		startY,
		startRect: { ...START_RECT },
	};
}

describe( 'computeShiftLockedResizeRect', () => {
	describe( 'corner handles', () => {
		it( 'preserves the start rect ratio when dragging the SE corner outward', () => {
			const drag = makeDrag( 'se' );
			// Drag right by 200px and down by 50px — width is the bigger
			// pixel motion, so it drives.
			const rect = computeShiftLockedResizeRect(
				drag,
				700,
				300,
				IMAGE,
				FULL_BOUNDS
			);

			const startPixelRatio =
				( START_RECT.width * IMAGE.width ) /
				( START_RECT.height * IMAGE.height );
			const newPixelRatio =
				( rect.width * IMAGE.width ) / ( rect.height * IMAGE.height );

			expect( newPixelRatio ).toBeCloseTo( startPixelRatio, 5 );
			// SE drag anchors at the NW corner of the start rect.
			expect( rect.x ).toBeCloseTo( START_RECT.x, 5 );
			expect( rect.y ).toBeCloseTo( START_RECT.y, 5 );
		} );

		it( 'preserves the start rect ratio when dragging the NW corner inward', () => {
			const drag = makeDrag( 'nw' );
			const rect = computeShiftLockedResizeRect(
				drag,
				600,
				300,
				IMAGE,
				FULL_BOUNDS
			);

			const startPixelRatio =
				( START_RECT.width * IMAGE.width ) /
				( START_RECT.height * IMAGE.height );
			const newPixelRatio =
				( rect.width * IMAGE.width ) / ( rect.height * IMAGE.height );
			expect( newPixelRatio ).toBeCloseTo( startPixelRatio, 5 );
			// NW drag anchors at the SE corner of the start rect.
			expect( rect.x + rect.width ).toBeCloseTo(
				START_RECT.x + START_RECT.width,
				5
			);
			expect( rect.y + rect.height ).toBeCloseTo(
				START_RECT.y + START_RECT.height,
				5
			);
		} );
	} );

	describe( 'edge handles — symmetric expansion', () => {
		it( 'east edge: expands height symmetrically around the start rect center', () => {
			const drag = makeDrag( 'e' );
			// Expand width by 100px to the right.
			const rect = computeShiftLockedResizeRect(
				drag,
				600,
				250,
				IMAGE,
				FULL_BOUNDS
			);

			const startCenterY = START_RECT.y + START_RECT.height / 2;
			expect( rect.y + rect.height / 2 ).toBeCloseTo( startCenterY, 5 );
			// x-anchored to start.x.
			expect( rect.x ).toBeCloseTo( START_RECT.x, 5 );
			// Ratio preserved.
			const startPixelRatio =
				( START_RECT.width * IMAGE.width ) /
				( START_RECT.height * IMAGE.height );
			const newPixelRatio =
				( rect.width * IMAGE.width ) / ( rect.height * IMAGE.height );
			expect( newPixelRatio ).toBeCloseTo( startPixelRatio, 5 );
		} );

		it( 'north edge: expands width symmetrically around the start rect center', () => {
			const drag = makeDrag( 'n' );
			// Drag the top edge up by 50px (taller crop).
			const rect = computeShiftLockedResizeRect(
				drag,
				500,
				200,
				IMAGE,
				FULL_BOUNDS
			);

			const startCenterX = START_RECT.x + START_RECT.width / 2;
			expect( rect.x + rect.width / 2 ).toBeCloseTo( startCenterX, 5 );
			// Bottom edge stays anchored.
			expect( rect.y + rect.height ).toBeCloseTo(
				START_RECT.y + START_RECT.height,
				5
			);
			const startPixelRatio =
				( START_RECT.width * IMAGE.width ) /
				( START_RECT.height * IMAGE.height );
			const newPixelRatio =
				( rect.width * IMAGE.width ) / ( rect.height * IMAGE.height );
			expect( newPixelRatio ).toBeCloseTo( startPixelRatio, 5 );
		} );
	} );

	describe( 'minimum size clamping preserves ratio', () => {
		it( 'east edge: clamps a tall crop without breaking ratio when width hits MIN_CROP_SIZE', () => {
			// Tall start rect — small ratio (0.0625 in normalized space).
			const tallStart = { x: 0.2, y: 0.1, width: 0.05, height: 0.8 };
			const drag: ResizeDragState = {
				handle: 'e',
				startX: 250,
				startY: 250,
				startRect: tallStart,
			};
			// Drag the east edge inward — width tries to shrink below MIN.
			const rect = computeShiftLockedResizeRect(
				drag,
				200,
				250,
				IMAGE,
				FULL_BOUNDS
			);

			const startRatio = tallStart.width / tallStart.height;
			const newRatio = rect.width / rect.height;
			expect( newRatio ).toBeCloseTo( startRatio, 5 );
			expect( rect.width ).toBeGreaterThanOrEqual( 0.05 - 1e-9 );
			expect( rect.height ).toBeGreaterThanOrEqual( 0.05 - 1e-9 );
		} );

		it( 'north edge: clamps a wide crop without breaking ratio when height hits MIN_CROP_SIZE', () => {
			// Wide start rect — large ratio (16 in normalized space).
			const wideStart = { x: 0.1, y: 0.4, width: 0.8, height: 0.05 };
			const drag: ResizeDragState = {
				handle: 'n',
				startX: 500,
				startY: 200,
				startRect: wideStart,
			};
			// Drag the north edge down — height tries to shrink below MIN.
			const rect = computeShiftLockedResizeRect(
				drag,
				500,
				220,
				IMAGE,
				FULL_BOUNDS
			);

			const startRatio = wideStart.width / wideStart.height;
			const newRatio = rect.width / rect.height;
			expect( newRatio ).toBeCloseTo( startRatio, 5 );
			expect( rect.width ).toBeGreaterThanOrEqual( 0.05 - 1e-9 );
			expect( rect.height ).toBeGreaterThanOrEqual( 0.05 - 1e-9 );
		} );
	} );

	describe( 'bounds clamping', () => {
		it( 'east edge: clamps height to the symmetric bounds limit and shrinks width to keep ratio', () => {
			// Center-y of START_RECT is 0.5; tightest bounds are bounds.minY=0.4
			// and bounds.maxY=0.6 → max half-height = 0.1, so max height = 0.2.
			const tightBounds: CropBounds = {
				minX: 0,
				minY: 0.4,
				maxX: 1,
				maxY: 0.6,
			};
			const drag = makeDrag( 'e' );
			// Drag far right — height would otherwise exceed the bound.
			const rect = computeShiftLockedResizeRect(
				drag,
				1000,
				250,
				IMAGE,
				tightBounds
			);

			expect( rect.height ).toBeLessThanOrEqual( 0.2 + 1e-9 );
			// Centered around 0.5.
			expect( rect.y + rect.height / 2 ).toBeCloseTo( 0.5, 5 );
			const startPixelRatio =
				( START_RECT.width * IMAGE.width ) /
				( START_RECT.height * IMAGE.height );
			const newPixelRatio =
				( rect.width * IMAGE.width ) / ( rect.height * IMAGE.height );
			expect( newPixelRatio ).toBeCloseTo( startPixelRatio, 5 );
		} );
	} );
} );
