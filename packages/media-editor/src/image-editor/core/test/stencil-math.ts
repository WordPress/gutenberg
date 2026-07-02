/**
 * Internal dependencies
 */
import {
	computeFreeResizeRect,
	computeLockedResizeRect,
	computeShiftLockedResizeRect,
	getMinCropPixels,
	type CropBounds,
	type ResizeDragState,
} from '../stencil-math';
import {
	DEFAULT_KEYBOARD_STEP,
	MIN_CROP_PIXELS,
	MIN_CROP_SCREEN_PX,
} from '../constants';
import type { Size } from '../types';

describe( 'getMinCropPixels — operable on-screen floor', () => {
	it( 'returns the source-pixel hard floor when the image is shown large enough', () => {
		const displayScale = ( MIN_CROP_SCREEN_PX / MIN_CROP_PIXELS ) * 1.1;

		expect( getMinCropPixels( displayScale ) ).toBe( MIN_CROP_PIXELS );
	} );

	it( 'raises the floor so the crop stays operable when the image is shown small', () => {
		// A large image fit into a small window: ~0.2 CSS px per source px.
		// The source-pixel floor would render too small on screen. The
		// usability term (44 / 0.2 = 220 source px) must win.
		expect( getMinCropPixels( 0.2 ) ).toBeCloseTo(
			MIN_CROP_SCREEN_PX / 0.2,
			5
		);
		expect( getMinCropPixels( 0.2 ) ).toBeGreaterThan( MIN_CROP_PIXELS );
	} );

	it( 'crosses over from usability floor to hard floor at displayScale = MIN_CROP_SCREEN_PX / MIN_CROP_PIXELS', () => {
		const crossover = MIN_CROP_SCREEN_PX / MIN_CROP_PIXELS;
		expect( getMinCropPixels( crossover ) ).toBeCloseTo(
			MIN_CROP_PIXELS,
			5
		);
		// Just below the crossover, the usability term exceeds the hard floor.
		expect( getMinCropPixels( crossover * 0.99 ) ).toBeGreaterThan(
			MIN_CROP_PIXELS
		);
	} );

	it( 'falls back to the hard floor for a non-positive display scale', () => {
		expect( getMinCropPixels( 0 ) ).toBe( MIN_CROP_PIXELS );
		expect( getMinCropPixels( -1 ) ).toBe( MIN_CROP_PIXELS );
	} );
} );

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

	it( 'keeps pointer resize continuous near the pixel-motion threshold', () => {
		const originalImageSize: Size = { width: 600, height: 400 };
		const fullImageCrop = { x: 0, y: 0, width: 1, height: 1 };
		const drag: ResizeDragState = {
			handle: 'nw',
			startX: 0,
			startY: 0,
			startRect: fullImageCrop,
		};

		const beforeThreshold = computeLockedResizeRect(
			drag,
			60,
			-39.6,
			originalImageSize,
			FULL_BOUNDS,
			1
		);
		const afterThreshold = computeLockedResizeRect(
			drag,
			60,
			-40.4,
			originalImageSize,
			FULL_BOUNDS,
			1
		);

		expect(
			Math.abs( beforeThreshold.width - afterThreshold.width )
		).toBeLessThan( 0.01 );
		expect(
			Math.abs( beforeThreshold.height - afterThreshold.height )
		).toBeLessThan( 0.01 );
	} );

	it( 'shrinks a locked-ratio crop from horizontal keyboard movement', () => {
		const squareImageSize: Size = { width: 500, height: 500 };
		const lockedStartRect = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
		const drag: ResizeDragState = {
			handle: 'nw',
			startX: 0,
			startY: 0,
			startRect: lockedStartRect,
		};
		const rect = computeLockedResizeRect(
			drag,
			DEFAULT_KEYBOARD_STEP * squareImageSize.width,
			0,
			squareImageSize,
			FULL_BOUNDS,
			1,
			undefined,
			'width'
		);

		expect( rect.x ).toBeCloseTo(
			lockedStartRect.x + DEFAULT_KEYBOARD_STEP,
			5
		);
		expect( rect.y ).toBeCloseTo(
			lockedStartRect.y + DEFAULT_KEYBOARD_STEP,
			5
		);
		expect( rect.width ).toBeCloseTo(
			lockedStartRect.width - DEFAULT_KEYBOARD_STEP,
			5
		);
		expect( rect.height ).toBeCloseTo(
			lockedStartRect.height - DEFAULT_KEYBOARD_STEP,
			5
		);
	} );

	it( 'shrinks a locked-ratio crop from vertical keyboard movement', () => {
		const squareImageSize: Size = { width: 500, height: 500 };
		const lockedStartRect = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
		const drag: ResizeDragState = {
			handle: 'nw',
			startX: 0,
			startY: 0,
			startRect: lockedStartRect,
		};
		const rect = computeLockedResizeRect(
			drag,
			0,
			DEFAULT_KEYBOARD_STEP * squareImageSize.height,
			squareImageSize,
			FULL_BOUNDS,
			1,
			undefined,
			'height'
		);

		expect( rect.x ).toBeCloseTo(
			lockedStartRect.x + DEFAULT_KEYBOARD_STEP,
			5
		);
		expect( rect.y ).toBeCloseTo(
			lockedStartRect.y + DEFAULT_KEYBOARD_STEP,
			5
		);
		expect( rect.width ).toBeCloseTo(
			lockedStartRect.width - DEFAULT_KEYBOARD_STEP,
			5
		);
		expect( rect.height ).toBeCloseTo(
			lockedStartRect.height - DEFAULT_KEYBOARD_STEP,
			5
		);
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

describe( 'per-axis minCropSize', () => {
	// Cover the explicit per-axis floor introduced for the source-pixel
	// minimum. The defaults (0.05, 0.05) are already covered by the
	// suites above; these tests pass `minCropSize` explicitly to lock in
	// the math the cropper relies on.
	const IMAGE_NON_SQUARE: Size = { width: 1000, height: 500 };

	describe( 'computeFreeResizeRect', () => {
		it( 'clamps the dragged edge to the per-axis floor (width)', () => {
			// SE handle from a wide start rect; drag left far enough that
			// width would collapse without the floor.
			const startRect = { x: 0.1, y: 0.1, width: 0.6, height: 0.6 };
			const drag: ResizeDragState = {
				handle: 'e',
				startX: 700,
				startY: 350,
				startRect,
			};
			const minCropSize: Size = { width: 0.2, height: 0.05 };
			const rect = computeFreeResizeRect(
				drag,
				0,
				350,
				IMAGE_NON_SQUARE,
				FULL_BOUNDS,
				minCropSize
			);
			expect( rect.width ).toBeCloseTo( minCropSize.width, 5 );
			// Left edge anchored at start; right edge pulled in to the floor.
			expect( rect.x ).toBeCloseTo( startRect.x, 5 );
		} );

		it( 'clamps the dragged edge to the per-axis floor (height)', () => {
			const startRect = { x: 0.1, y: 0.1, width: 0.6, height: 0.6 };
			const drag: ResizeDragState = {
				handle: 's',
				startX: 500,
				startY: 350,
				startRect,
			};
			const minCropSize: Size = { width: 0.05, height: 0.3 };
			const rect = computeFreeResizeRect(
				drag,
				500,
				0,
				IMAGE_NON_SQUARE,
				FULL_BOUNDS,
				minCropSize
			);
			expect( rect.height ).toBeCloseTo( minCropSize.height, 5 );
			expect( rect.y ).toBeCloseTo( startRect.y, 5 );
		} );

		it( 'uses width vs height independently — different floors per axis', () => {
			// Drag NW corner inward far past both floors. The per-axis
			// floors clamp x-collapse and y-collapse independently.
			const startRect = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
			const drag: ResizeDragState = {
				handle: 'nw',
				startX: 100,
				startY: 50,
				startRect,
			};
			const minCropSize: Size = { width: 0.4, height: 0.1 };
			const rect = computeFreeResizeRect(
				drag,
				1000,
				500,
				IMAGE_NON_SQUARE,
				FULL_BOUNDS,
				minCropSize
			);
			// Both floors hit at the same time on different axes.
			expect( rect.width ).toBeCloseTo( minCropSize.width, 5 );
			expect( rect.height ).toBeCloseTo( minCropSize.height, 5 );
		} );
	} );

	describe( 'computeLockedResizeRect — per-axis floor projects through the ratio', () => {
		// Wide image, square aspect ratio. The per-axis floor projection
		// in `minDistW = max(minCropSize.width, minCropSize.height * normalizedRatio)`
		// is the load-bearing piece for non-equal per-axis floors.
		const imageSize: Size = { width: 2000, height: 1000 };
		const aspectRatio = 1; // pixel-square
		const normalizedRatio =
			( aspectRatio * imageSize.height ) / imageSize.width; // 0.5
		const startRect = { x: 0, y: 0, width: 0, height: 0 };

		it( 'lifts width to satisfy the height floor when the height floor is the binding axis', () => {
			// Drag SE inward to zero — both axes try to collapse. With
			// minCropSize = { 0.01, 0.05 } and normalizedRatio 0.5,
			// minDistW = max(0.01, 0.05 * 0.5) = 0.025, minDistH = 0.05.
			// Driver: pixel motion equal → height drives → distW = distH/2.
			const drag: ResizeDragState = {
				handle: 'se',
				startX: 0,
				startY: 0,
				startRect,
			};
			const minCropSize: Size = { width: 0.01, height: 0.05 };
			const rect = computeLockedResizeRect(
				drag,
				1,
				1,
				imageSize,
				FULL_BOUNDS,
				normalizedRatio,
				minCropSize
			);
			// Height floor binds: width is `height * normalizedRatio`.
			expect( rect.height ).toBeCloseTo( minCropSize.height, 5 );
			expect( rect.width ).toBeCloseTo(
				minCropSize.height * normalizedRatio,
				5
			);
		} );

		it( 'lifts height to satisfy the width floor when the width floor binds', () => {
			// minDistW = max(0.2, 0.05 * 0.5) = 0.2, minDistH = 0.4.
			const drag: ResizeDragState = {
				handle: 'se',
				startX: 0,
				startY: 0,
				startRect,
			};
			const minCropSize: Size = { width: 0.2, height: 0.05 };
			const rect = computeLockedResizeRect(
				drag,
				1,
				1,
				imageSize,
				FULL_BOUNDS,
				normalizedRatio,
				minCropSize
			);
			expect( rect.width ).toBeCloseTo( 0.2, 5 );
			expect( rect.height ).toBeCloseTo( 0.4, 5 );
		} );
	} );

	describe( 'computeShiftLockedResizeRect — edge handles', () => {
		// Shift-locked edge resize must enforce the floor on the driver
		// axis and on the perpendicular axis after projecting through
		// the start rect's normalized ratio.
		const imageSize: Size = { width: 1000, height: 500 };
		// Wide start rect — normalizedRatio = 0.4/0.4 = 1.
		const startRect = { x: 0.3, y: 0.3, width: 0.4, height: 0.4 };

		it( 'east edge: width-driver respects width floor and projects to height', () => {
			const drag: ResizeDragState = {
				handle: 'e',
				startX: 700,
				startY: 400,
				startRect,
			};
			// Drag well past the floor toward the start anchor.
			const minCropSize: Size = { width: 0.2, height: 0.05 };
			const rect = computeShiftLockedResizeRect(
				drag,
				300,
				400,
				imageSize,
				FULL_BOUNDS,
				minCropSize
			);
			// Width clamped at the per-axis floor; height follows ratio (1:1).
			expect( rect.width ).toBeCloseTo( minCropSize.width, 5 );
			expect( rect.height ).toBeCloseTo( minCropSize.width, 5 );
		} );

		it( 'north edge: height-driver respects height floor and projects to width', () => {
			const drag: ResizeDragState = {
				handle: 'n',
				startX: 500,
				startY: 300,
				startRect,
			};
			const minCropSize: Size = { width: 0.05, height: 0.2 };
			const rect = computeShiftLockedResizeRect(
				drag,
				500,
				700,
				imageSize,
				FULL_BOUNDS,
				minCropSize
			);
			expect( rect.height ).toBeCloseTo( minCropSize.height, 5 );
			expect( rect.width ).toBeCloseTo( minCropSize.height, 5 );
		} );
	} );
} );
