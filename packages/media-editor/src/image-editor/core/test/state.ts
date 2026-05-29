import type { CropperState, Size } from '../types';
import { ABSOLUTE_MIN_ZOOM, DEFAULT_STATE, MAX_ZOOM } from '../constants';
import { cropperReducer, enforceContainment, isStateDirty } from '../state';
import {
	createCamera,
	screenToWorld,
	getVisibleBounds,
	getImageFit,
} from '../camera';

const IMAGE: Size = { width: 1600, height: 900 };
const PORTRAIT_IMAGE: Size = { width: 900, height: 1600 };
const CONTAINER: Size = { width: 800, height: 600 };

function makeState( overrides: Partial< CropperState > = {} ): CropperState {
	const merged = {
		...DEFAULT_STATE,
		image: {
			src: 'test.jpg',
			naturalWidth: IMAGE.width,
			naturalHeight: IMAGE.height,
		},
		...overrides,
	};
	// Default base fields to the live values so tests setting `zoom`,
	// `crop`, or `rotation` represent a user who explicitly committed
	// to that pose. Tests that want to exercise base/live divergence
	// can set the base fields explicitly in overrides.
	if ( overrides.baseZoom === undefined ) {
		merged.baseZoom = merged.zoom;
	}
	if ( overrides.basePan === undefined ) {
		merged.basePan = { x: merged.pan.x, y: merged.pan.y };
	}
	if ( overrides.baseRotation === undefined ) {
		merged.baseRotation = merged.rotation;
	}
	return merged;
}

/**
 * Get the world-space region visible through the crop rect.
 *
 * Projects the four crop-rect corners from screen space back to
 * normalized world space [0,1], returning the axis-aligned bounding
 * box. This tells us exactly what part of the image the user sees
 * inside the crop area.
 *
 * @param state         The cropper state to inspect.
 * @param imageSize     The natural image dimensions.
 * @param containerSize The container dimensions.
 * @return The world-space AABB of the visible region.
 */
function getCropWorldRegion(
	state: CropperState,
	imageSize: Size,
	containerSize: Size
): { minX: number; minY: number; maxX: number; maxY: number } {
	const camera = createCamera( state, containerSize, imageSize );

	// Build base camera (zero pan, zoom=1) for stencil positioning.
	const baseCamera = createCamera(
		{ ...state, pan: { x: 0, y: 0 }, zoom: 1 },
		containerSize,
		imageSize
	);
	const vb = getVisibleBounds( baseCamera );
	const cr = state.cropRect;

	// Stencil corners in screen space.
	const corners: { x: number; y: number }[] = [
		{ x: vb.left + cr.x * vb.width, y: vb.top + cr.y * vb.height },
		{
			x: vb.left + ( cr.x + cr.width ) * vb.width,
			y: vb.top + cr.y * vb.height,
		},
		{
			x: vb.left + ( cr.x + cr.width ) * vb.width,
			y: vb.top + ( cr.y + cr.height ) * vb.height,
		},
		{
			x: vb.left + cr.x * vb.width,
			y: vb.top + ( cr.y + cr.height ) * vb.height,
		},
	];

	// Map to world space via inverse camera.
	const worldPoints = corners.map( ( c ) => screenToWorld( camera, c ) );
	return {
		minX: Math.min( ...worldPoints.map( ( p ) => p.x ) ),
		minY: Math.min( ...worldPoints.map( ( p ) => p.y ) ),
		maxX: Math.max( ...worldPoints.map( ( p ) => p.x ) ),
		maxY: Math.max( ...worldPoints.map( ( p ) => p.y ) ),
	};
}

describe( 'enforceContainment', () => {
	it( 'is nearly a no-op at default state', () => {
		const state = makeState();
		const result = enforceContainment( state );
		// Floating-point epsilon may introduce tiny drift (~1e-9),
		// so we check closeness rather than reference equality.
		expect( result.pan.x ).toBeCloseTo( 0, 5 );
		expect( result.pan.y ).toBeCloseTo( 0, 5 );
		expect( result.zoom ).toBeCloseTo( 1, 5 );
		expect( result.cropRect ).toEqual( state.cropRect );
	} );

	it( 'keeps zoom at the absolute minimum for a degenerate crop rect', () => {
		// A degenerate crop has coverage minimum 0; the floor must come
		// from ABSOLUTE_MIN_ZOOM. Use a sub-floor (but >EPSILON) zoom so
		// sanitization doesn't bump it to 1 before restrictPanZoom runs.
		const state = makeState( {
			cropRect: { x: 0.5, y: 0.5, width: 0, height: 0 },
			zoom: ABSOLUTE_MIN_ZOOM / 2,
		} );
		const result = enforceContainment( state );

		expect( result.zoom ).toBe( ABSOLUTE_MIN_ZOOM );
	} );

	it( 'bumps zoom before shrinking crop for small rotation', () => {
		const state = makeState( {
			rotation: 15,
			zoom: 1,
		} );
		const result = enforceContainment( state );
		// Zoom should be bumped to cover the rotated image.
		expect( result.zoom ).toBeGreaterThan( 1 );
		// Crop rect should remain full size (zoom was bumped instead of shrinking crop).
		expect( result.cropRect.width ).toBeCloseTo( 1, 2 );
		expect( result.cropRect.height ).toBeCloseTo( 1, 2 );
	} );

	it( 'returns same reference when nothing changes', () => {
		const state = makeState( { zoom: 2 } );
		const enforced = enforceContainment( state );
		const enforced2 = enforceContainment( enforced );
		expect( enforced2 ).toBe( enforced );
	} );
} );

describe( 'isStateDirty', () => {
	it( 'ignores floating-point noise from containment math', () => {
		const initial = makeState();
		const current = makeState( {
			pan: { x: initial.pan.x, y: initial.pan.y + 2e-8 },
		} );

		expect( isStateDirty( current, initial ) ).toBe( false );
	} );

	it( 'detects visible cropper state changes', () => {
		const initial = makeState();
		const current = makeState( {
			pan: { x: initial.pan.x, y: initial.pan.y + 0.01 },
		} );

		expect( isStateDirty( current, initial ) ).toBe( true );
	} );
} );

describe( 'cropperReducer — SETTLE_CROP', () => {
	/**
	 * Assert that the world-space region visible through the crop is
	 * the same before and after SETTLE_CROP, within a tolerance.
	 *
	 * @param before    State before settle.
	 * @param after     State after settle.
	 * @param tolerance Allowed difference per axis (default 0.02).
	 */
	function expectSameVisibleRegion(
		before: CropperState,
		after: CropperState,
		tolerance = 0.02
	) {
		const regionBefore = getCropWorldRegion( before, IMAGE, CONTAINER );
		const regionAfter = getCropWorldRegion( after, IMAGE, CONTAINER );

		expect( regionAfter.minX ).toBeCloseTo(
			regionBefore.minX,
			-Math.log10( tolerance )
		);
		expect( regionAfter.minY ).toBeCloseTo(
			regionBefore.minY,
			-Math.log10( tolerance )
		);
		expect( regionAfter.maxX ).toBeCloseTo(
			regionBefore.maxX,
			-Math.log10( tolerance )
		);
		expect( regionAfter.maxY ).toBeCloseTo(
			regionBefore.maxY,
			-Math.log10( tolerance )
		);
	}

	it( 'preserves image selection for a centered small crop', () => {
		const state = makeState( {
			cropRect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
			zoom: 1,
			pan: { x: 0, y: 0 },
		} );
		const settled = cropperReducer( state, { type: 'SETTLE_CROP' } );

		// Crop rect should expand to fill the visual area.
		expect( settled.cropRect.width ).toBeGreaterThan( 0.9 );
		// Zoom should increase to compensate for the larger crop.
		expect( settled.zoom ).toBeGreaterThan( state.zoom );
		// The same image region should be visible.
		expectSameVisibleRegion( state, settled );
	} );

	it( 'preserves image selection for an off-center crop', () => {
		const state = makeState( {
			cropRect: { x: 0.1, y: 0.1, width: 0.4, height: 0.3 },
			zoom: 1.5,
			pan: { x: 0.05, y: -0.02 },
		} );
		const settled = cropperReducer( state, { type: 'SETTLE_CROP' } );

		expect( settled.zoom ).toBeGreaterThan( 0 );
		expectSameVisibleRegion( state, settled );
	} );

	it( 'preserves image selection for a wide crop (landscape)', () => {
		// Wide crop: fills width, short in height.
		const state = makeState( {
			cropRect: { x: 0.0, y: 0.3, width: 1.0, height: 0.4 },
			zoom: 1,
			pan: { x: 0, y: 0 },
		} );
		const settled = cropperReducer( state, { type: 'SETTLE_CROP' } );

		// Aspect ratio of crop should be preserved.
		const ratioBefore = state.cropRect.width / state.cropRect.height;
		const ratioAfter = settled.cropRect.width / settled.cropRect.height;
		expect( ratioAfter ).toBeCloseTo( ratioBefore, 2 );

		expectSameVisibleRegion( state, settled );
	} );

	it( 'preserves image selection for a tall crop (portrait)', () => {
		const state = makeState( {
			cropRect: { x: 0.3, y: 0.0, width: 0.4, height: 1.0 },
			zoom: 1,
			pan: { x: 0, y: 0 },
		} );
		const settled = cropperReducer( state, { type: 'SETTLE_CROP' } );

		const ratioBefore = state.cropRect.width / state.cropRect.height;
		const ratioAfter = settled.cropRect.width / settled.cropRect.height;
		expect( ratioAfter ).toBeCloseTo( ratioBefore, 2 );

		expectSameVisibleRegion( state, settled );
	} );

	it( 'preserves image selection after zoom + off-center crop', () => {
		const state = makeState( {
			cropRect: { x: 0.05, y: 0.2, width: 0.6, height: 0.5 },
			zoom: 2,
			pan: { x: 0.1, y: -0.05 },
		} );
		const settled = cropperReducer( state, { type: 'SETTLE_CROP' } );

		expect( settled.zoom ).toBeGreaterThan( 0 );
		expectSameVisibleRegion( state, settled );
	} );

	it( 'preserves image selection with rotation', () => {
		// After rotation, the user resizes the crop. Settle should still
		// preserve what they see.
		const state = makeState( {
			cropRect: { x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
			zoom: 1.3,
			rotation: 20,
			pan: { x: 0, y: 0 },
		} );
		const settled = cropperReducer( state, { type: 'SETTLE_CROP' } );

		expect( settled.zoom ).toBeGreaterThan( 0 );
		expectSameVisibleRegion( state, settled );
	} );

	it( 'caps zoom at MAX_ZOOM for tight crops and keeps the visible region', () => {
		// A 5% crop at zoom=1 would otherwise settle to zoom=20 (1/0.05),
		// pushing state past the user-facing zoom cap and breaking wheel
		// and slider interactions that clamp to MAX_ZOOM. With the cap,
		// the post-settle crop is smaller than the viewport but the
		// content the user framed is preserved.
		const state = makeState( {
			cropRect: { x: 0.4, y: 0.4, width: 0.05, height: 0.05 },
			zoom: 1,
			pan: { x: 0, y: 0 },
		} );
		const settled = cropperReducer( state, { type: 'SETTLE_CROP' } );

		expect( settled.zoom ).toBeCloseTo( MAX_ZOOM, 5 );
		// The scale was capped at MAX_ZOOM/zoom (=10), not at the uncapped
		// fit scale of 20 — so the new crop is 5% × 10 = 50% of the viewport,
		// not 100%.
		expect( settled.cropRect.width ).toBeCloseTo( 0.5, 5 );
		expect( settled.cropRect.height ).toBeCloseTo( 0.5, 5 );
		expectSameVisibleRegion( state, settled );
	} );

	it( 'allows a fine-rotated tall portrait crop to settle below 1x zoom', () => {
		const state = makeState( {
			image: {
				src: 'portrait.jpg',
				naturalWidth: PORTRAIT_IMAGE.width,
				naturalHeight: PORTRAIT_IMAGE.height,
			},
			cropRect: { x: 0.46, y: -0.02, width: 0.08, height: 1.04 },
			rotation: 19,
			zoom: 1,
			pan: { x: 0, y: 0 },
		} );
		const settled = cropperReducer( state, { type: 'SETTLE_CROP' } );

		expect( settled.cropRect.height ).toBeCloseTo( 1, 5 );
		expect( settled.zoom ).toBeLessThan( 1 );
		expect( settled.zoom ).toBeGreaterThan( 0.95 );

		const regionBefore = getCropWorldRegion(
			state,
			PORTRAIT_IMAGE,
			CONTAINER
		);
		const regionAfter = getCropWorldRegion(
			settled,
			PORTRAIT_IMAGE,
			CONTAINER
		);
		expect( regionAfter.minX ).toBeCloseTo( regionBefore.minX, 1 );
		expect( regionAfter.minY ).toBeCloseTo( regionBefore.minY, 1 );
		expect( regionAfter.maxX ).toBeCloseTo( regionBefore.maxX, 1 );
		expect( regionAfter.maxY ).toBeCloseTo( regionBefore.maxY, 1 );
	} );

	it( 'is a no-op when crop is already full-sized and centered', () => {
		const state = makeState( {
			cropRect: { x: 0, y: 0, width: 1, height: 1 },
			zoom: 1,
			pan: { x: 0, y: 0 },
		} );
		const settled = cropperReducer( state, { type: 'SETTLE_CROP' } );

		// Crop should remain the same.
		expect( settled.cropRect.x ).toBeCloseTo( 0, 5 );
		expect( settled.cropRect.y ).toBeCloseTo( 0, 5 );
		expect( settled.cropRect.width ).toBeCloseTo( 1, 5 );
		expect( settled.cropRect.height ).toBeCloseTo( 1, 5 );
		expect( settled.zoom ).toBeCloseTo( 1, 5 );
	} );

	it( 'preserves image selection across 50 random crop/zoom/pan combos', () => {
		for ( let i = 0; i < 50; i++ ) {
			// Generate deterministic-ish crop rects in the preservation
			// regime. Capped zoom behavior is covered by a dedicated test.
			const cropW = 0.4 + ( ( i * 7 ) % 6 ) / 10;
			const cropH = 0.4 + ( ( i * 11 ) % 6 ) / 10;
			const cropX = Math.min( ( ( i * 3 ) % 10 ) / 10, 1 - cropW );
			const cropY = Math.min( ( ( i * 5 ) % 10 ) / 10, 1 - cropH );
			const zoom = 1 + ( ( i * 13 ) % 12 ) / 10;
			const panX = ( ( ( i * 17 ) % 20 ) - 10 ) / 100;
			const panY = ( ( ( i * 19 ) % 20 ) - 10 ) / 100;

			const state = enforceContainment(
				makeState( {
					cropRect: {
						x: cropX,
						y: cropY,
						width: cropW,
						height: cropH,
					},
					zoom,
					pan: { x: panX, y: panY },
				} )
			);

			const settled = cropperReducer( state, {
				type: 'SETTLE_CROP',
			} );

			const expectedUncappedZoom =
				state.zoom /
				Math.max( state.cropRect.width, state.cropRect.height );
			expect( expectedUncappedZoom ).toBeLessThanOrEqual( MAX_ZOOM );

			const regionBefore = getCropWorldRegion( state, IMAGE, CONTAINER );
			const regionAfter = getCropWorldRegion( settled, IMAGE, CONTAINER );

			const dx = Math.abs( regionAfter.minX - regionBefore.minX );
			const dy = Math.abs( regionAfter.minY - regionBefore.minY );
			const dw = Math.abs(
				regionAfter.maxX -
					regionAfter.minX -
					( regionBefore.maxX - regionBefore.minX )
			);
			const dh = Math.abs(
				regionAfter.maxY -
					regionAfter.minY -
					( regionBefore.maxY - regionBefore.minY )
			);

			// Allow 3% tolerance — enforceContainment may nudge
			// things slightly when the crop is near image edges.
			const tol = 0.03;
			expect( dx ).toBeLessThanOrEqual( tol );
			expect( dy ).toBeLessThanOrEqual( tol );
			expect( dw ).toBeLessThanOrEqual( tol );
			expect( dh ).toBeLessThanOrEqual( tol );
		}
	} );

	it( 'diagonal corner drag: small crop settles accurately', () => {
		// Simulate dragging SE corner diagonally inward to make a small crop.
		// Start with full crop, drag to 30% x 30%.
		const afterDrag = enforceContainment(
			makeState( {
				cropRect: { x: 0.0, y: 0.0, width: 0.3, height: 0.3 },
				zoom: 1,
				pan: { x: 0, y: 0 },
			} )
		);

		const settled = cropperReducer( afterDrag, { type: 'SETTLE_CROP' } );

		// The settled crop should fill the visual area.
		expect(
			Math.max( settled.cropRect.width, settled.cropRect.height )
		).toBeCloseTo( 1, 1 );

		// The visible image region should be preserved.
		const regionBefore = getCropWorldRegion( afterDrag, IMAGE, CONTAINER );
		const regionAfter = getCropWorldRegion( settled, IMAGE, CONTAINER );

		// Width/height of the visible region should match.
		const wBefore = regionBefore.maxX - regionBefore.minX;
		const hBefore = regionBefore.maxY - regionBefore.minY;
		const wAfter = regionAfter.maxX - regionAfter.minX;
		const hAfter = regionAfter.maxY - regionAfter.minY;
		expect( wAfter ).toBeCloseTo( wBefore, 1 );
		expect( hAfter ).toBeCloseTo( hBefore, 1 );

		// Position should match.
		expect( regionAfter.minX ).toBeCloseTo( regionBefore.minX, 1 );
		expect( regionAfter.minY ).toBeCloseTo( regionBefore.minY, 1 );
	} );

	it( 'diagonal corner drag from NW: off-center small crop settles accurately', () => {
		// Dragging NW corner inward — crop ends up at bottom-right.
		const afterDrag = enforceContainment(
			makeState( {
				cropRect: { x: 0.5, y: 0.5, width: 0.4, height: 0.4 },
				zoom: 1,
				pan: { x: 0, y: 0 },
			} )
		);

		const settled = cropperReducer( afterDrag, { type: 'SETTLE_CROP' } );

		const regionBefore = getCropWorldRegion( afterDrag, IMAGE, CONTAINER );
		const regionAfter = getCropWorldRegion( settled, IMAGE, CONTAINER );

		const wBefore = regionBefore.maxX - regionBefore.minX;
		const hBefore = regionBefore.maxY - regionBefore.minY;
		const wAfter = regionAfter.maxX - regionAfter.minX;
		const hAfter = regionAfter.maxY - regionAfter.minY;
		expect( wAfter ).toBeCloseTo( wBefore, 1 );
		expect( hAfter ).toBeCloseTo( hBefore, 1 );
		expect( regionAfter.minX ).toBeCloseTo( regionBefore.minX, 1 );
		expect( regionAfter.minY ).toBeCloseTo( regionBefore.minY, 1 );
	} );

	it( 'diagonal drag to very small crop does not over-zoom', () => {
		// Extreme case: 10% crop. Zoom should be ~10x (or capped at MAX_ZOOM).
		const afterDrag = enforceContainment(
			makeState( {
				cropRect: { x: 0.45, y: 0.45, width: 0.1, height: 0.1 },
				zoom: 1,
				pan: { x: 0, y: 0 },
			} )
		);

		const settled = cropperReducer( afterDrag, { type: 'SETTLE_CROP' } );

		// Zoom should be proportional to 1/0.1 = 10.
		// But MAX_ZOOM may cap it.
		expect( settled.zoom ).toBeLessThanOrEqual( 10 );
		expect( settled.zoom ).toBeGreaterThan( 5 );

		const regionBefore = getCropWorldRegion( afterDrag, IMAGE, CONTAINER );
		const regionAfter = getCropWorldRegion( settled, IMAGE, CONTAINER );
		const wBefore = regionBefore.maxX - regionBefore.minX;
		const wAfter = regionAfter.maxX - regionAfter.minX;
		expect( wAfter ).toBeCloseTo( wBefore, 1 );
	} );

	it( 'caps settle zoom for crops smaller than the maximum zoom can preserve', () => {
		const afterDrag = enforceContainment(
			makeState( {
				cropRect: { x: 0.475, y: 0.475, width: 0.05, height: 0.05 },
				zoom: 1,
				pan: { x: 0, y: 0 },
			} )
		);

		const settled = cropperReducer( afterDrag, { type: 'SETTLE_CROP' } );

		expect( settled.zoom ).toBe( MAX_ZOOM );

		const regionAfter = getCropWorldRegion( settled, IMAGE, CONTAINER );
		expect( regionAfter.minX ).toBeGreaterThanOrEqual( -0.001 );
		expect( regionAfter.minY ).toBeGreaterThanOrEqual( -0.001 );
		expect( regionAfter.maxX ).toBeLessThanOrEqual( 1.001 );
		expect( regionAfter.maxY ).toBeLessThanOrEqual( 1.001 );
	} );
} );

describe( 'cropperReducer — SET_ZOOM_AT_POINT', () => {
	it( 'focal-point zoom preserves the focal point position', () => {
		const state = makeState( { zoom: 1, pan: { x: 0, y: 0 } } );
		const { elementSize, visualSize } = getImageFit( CONTAINER, IMAGE, 0 );

		// Simulate focal point at top-left quarter of the container.
		const focalScreenX = CONTAINER.width * 0.25;
		const focalScreenY = CONTAINER.height * 0.25;

		// Compute what world point is under the focal point before zoom.
		const cameraBefore = createCamera( state, CONTAINER, elementSize );
		const worldBefore = screenToWorld( cameraBefore, {
			x: focalScreenX,
			y: focalScreenY,
		} );

		// Apply focal-point zoom using the same formula as the interaction controller.
		const newZoom = 2;
		const visSize = visualSize;
		const fx = focalScreenX - CONTAINER.width / 2;
		const fy = focalScreenY - CONTAINER.height / 2;
		const zoomRatio = 1 - newZoom / state.zoom;
		const focalNormX = fx / visSize.width;
		const focalNormY = fy / visSize.height;
		const newCropX = state.pan.x + ( focalNormX - state.pan.x ) * zoomRatio;
		const newCropY = state.pan.y + ( focalNormY - state.pan.y ) * zoomRatio;

		const zoomed = cropperReducer( state, {
			type: 'SET_ZOOM_AT_POINT',
			payload: { zoom: newZoom, pan: { x: newCropX, y: newCropY } },
		} );

		// Compute what world point is under the focal point after zoom.
		const cameraAfter = createCamera( zoomed, CONTAINER, elementSize );
		const worldAfter = screenToWorld( cameraAfter, {
			x: focalScreenX,
			y: focalScreenY,
		} );

		// The same world point should be under the cursor.
		expect( worldAfter.x ).toBeCloseTo( worldBefore.x, 1 );
		expect( worldAfter.y ).toBeCloseTo( worldBefore.y, 1 );
	} );
} );

describe( 'cropperReducer — SNAP_ROTATE_90', () => {
	it( 'swaps crop width and height around the same center', () => {
		const state = makeState( {
			cropRect: { x: 0.1, y: 0.2, width: 0.6, height: 0.4 },
		} );
		const centerBefore = {
			x: state.cropRect.x + state.cropRect.width / 2,
			y: state.cropRect.y + state.cropRect.height / 2,
		};

		const rotated = cropperReducer( state, {
			type: 'SNAP_ROTATE_90',
			payload: { direction: 1 },
		} );

		const centerAfter = {
			x: rotated.cropRect.x + rotated.cropRect.width / 2,
			y: rotated.cropRect.y + rotated.cropRect.height / 2,
		};

		// Center should be preserved.
		expect( centerAfter.x ).toBeCloseTo( centerBefore.x, 2 );
		expect( centerAfter.y ).toBeCloseTo( centerBefore.y, 2 );

		// Rotation should advance by 90.
		expect( rotated.rotation ).toBe( 90 );
	} );

	it( 'rotates pan 90° CW so framed content stays framed', () => {
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.1, y: 0.2 },
		} );

		const rotated = cropperReducer( state, {
			type: 'SNAP_ROTATE_90',
			payload: { direction: 1 },
		} );

		// CW rotation: (px, py) → (-py, px)
		expect( rotated.pan.x ).toBeCloseTo( -0.2, 5 );
		expect( rotated.pan.y ).toBeCloseTo( 0.1, 5 );
	} );

	it( 'rotates pan 90° CCW in the other direction', () => {
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.1, y: 0.2 },
		} );

		const rotated = cropperReducer( state, {
			type: 'SNAP_ROTATE_90',
			payload: { direction: -1 },
		} );

		// CCW rotation: (px, py) → (py, -px)
		expect( rotated.pan.x ).toBeCloseTo( 0.2, 5 );
		expect( rotated.pan.y ).toBeCloseTo( -0.1, 5 );
	} );

	it( 'four CW 90° rotations return pan to the original position', () => {
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.15, y: -0.08 },
		} );
		let result = state;
		for ( let i = 0; i < 4; i++ ) {
			result = cropperReducer( result, {
				type: 'SNAP_ROTATE_90',
				payload: { direction: 1 },
			} );
		}
		expect( result.pan.x ).toBeCloseTo( state.pan.x, 5 );
		expect( result.pan.y ).toBeCloseTo( state.pan.y, 5 );
	} );

	it( 'single-axis flip: direction=+1 means visual CW, so rotation field decreases', () => {
		// `direction` is the visual rotation the caller wants. With a
		// single-axis flip, on-screen rotation is reversed relative to
		// the rotation field, so internally the field decreases by 90°
		// to achieve a visual CW rotation. Pan still rotates by +90° in
		// the visual direction to keep framing.
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.1, y: 0.2 },
			rotation: 0,
			flip: { horizontal: true, vertical: false },
		} );

		const rotated = cropperReducer( state, {
			type: 'SNAP_ROTATE_90',
			payload: { direction: 1 },
		} );

		// Field moved 0 → 270 (i.e. -90 normalized).
		expect( rotated.rotation ).toBe( 270 );
		// Pan rotates by +90° CW: (px, py) → (-py, px).
		expect( rotated.pan.x ).toBeCloseTo( -0.2, 5 );
		expect( rotated.pan.y ).toBeCloseTo( 0.1, 5 );
	} );

	it( 'both-axis flip: rotation field advances normally (two flips cancel)', () => {
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.1, y: 0.2 },
			flip: { horizontal: true, vertical: true },
		} );

		const rotated = cropperReducer( state, {
			type: 'SNAP_ROTATE_90',
			payload: { direction: 1 },
		} );

		expect( rotated.rotation ).toBe( 90 );
		expect( rotated.pan.x ).toBeCloseTo( -0.2, 5 );
		expect( rotated.pan.y ).toBeCloseTo( 0.1, 5 );
	} );
} );

describe( 'cropperReducer — SET_FLIP', () => {
	it( 'mirrors cropRect horizontally on horizontal flip', () => {
		const state = makeState( {
			cropRect: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
		} );

		const flipped = cropperReducer( state, {
			type: 'SET_FLIP',
			payload: { horizontal: true, vertical: false },
		} );

		// x mirrors: newX = 1 - oldX - width
		expect( flipped.cropRect.x ).toBeCloseTo( 0.6, 5 );
		expect( flipped.cropRect.y ).toBe( 0.2 );
		expect( flipped.cropRect.width ).toBe( 0.3 );
		expect( flipped.cropRect.height ).toBe( 0.4 );
	} );

	it( 'mirrors cropRect vertically on vertical flip', () => {
		const state = makeState( {
			cropRect: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
		} );

		const flipped = cropperReducer( state, {
			type: 'SET_FLIP',
			payload: { horizontal: false, vertical: true },
		} );

		expect( flipped.cropRect.x ).toBe( 0.1 );
		expect( flipped.cropRect.y ).toBeCloseTo( 0.4, 5 );
		expect( flipped.cropRect.width ).toBe( 0.3 );
		expect( flipped.cropRect.height ).toBe( 0.4 );
	} );

	it( 'mirrors pan horizontally on horizontal flip', () => {
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.15, y: 0.07 },
		} );

		const flipped = cropperReducer( state, {
			type: 'SET_FLIP',
			payload: { horizontal: true, vertical: false },
		} );

		expect( flipped.pan.x ).toBeCloseTo( -0.15, 5 );
		expect( flipped.pan.y ).toBeCloseTo( 0.07, 5 );
	} );

	it( 'is its own inverse — two flips return to the original', () => {
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.1, y: -0.05 },
			cropRect: { x: 0.2, y: 0.3, width: 0.5, height: 0.4 },
		} );

		const once = cropperReducer( state, {
			type: 'SET_FLIP',
			payload: { horizontal: true, vertical: true },
		} );
		const twice = cropperReducer( once, {
			type: 'SET_FLIP',
			payload: { horizontal: false, vertical: false },
		} );

		expect( twice.pan.x ).toBeCloseTo( state.pan.x, 5 );
		expect( twice.pan.y ).toBeCloseTo( state.pan.y, 5 );
		expect( twice.cropRect.x ).toBeCloseTo( state.cropRect.x, 5 );
		expect( twice.cropRect.y ).toBeCloseTo( state.cropRect.y, 5 );
	} );

	it( 'does nothing to cropRect or pan when flip state is unchanged', () => {
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.1, y: 0.2 },
			cropRect: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
			flip: { horizontal: true, vertical: false },
		} );

		const result = cropperReducer( state, {
			type: 'SET_FLIP',
			payload: { horizontal: true, vertical: false },
		} );

		expect( result.pan.x ).toBeCloseTo( 0.1, 5 );
		expect( result.pan.y ).toBeCloseTo( 0.2, 5 );
		expect( result.cropRect.x ).toBe( 0.1 );
	} );

	it( 'flip is viewport-relative — negates pan axis independent of rotation', () => {
		// With viewport-relative flip, a horizontal flip always negates pan.x
		// regardless of current rotation (same viewport axis gets mirrored).
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.15, y: 0.07 },
			rotation: 90,
		} );

		const flipped = cropperReducer( state, {
			type: 'SET_FLIP',
			payload: { horizontal: true, vertical: false },
		} );

		expect( flipped.pan.x ).toBeCloseTo( -0.15, 5 );
		expect( flipped.pan.y ).toBeCloseTo( 0.07, 5 );
	} );
} );

describe( 'cropperReducer — SET_ROTATION', () => {
	it( 'rotates pan by the angle delta', () => {
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.1, y: 0 },
			rotation: 0,
		} );

		// 90° rotation via SET_ROTATION: same math as SNAP_ROTATE_90
		// pan: (0.1, 0) → (0, 0.1) after 90° CCW in standard math
		// (positive rotation in our sin/cos convention)
		const rotated = cropperReducer( state, {
			type: 'SET_ROTATION',
			payload: 90,
		} );

		// delta = 90°; cos(90°)=0, sin(90°)=1
		// newX = px*0 - py*1 = 0
		// newY = px*1 + py*0 = 0.1
		expect( rotated.pan.x ).toBeCloseTo( 0, 5 );
		expect( rotated.pan.y ).toBeCloseTo( 0.1, 5 );
	} );

	it( 'preserves zoom (no reset)', () => {
		const state = makeState( { zoom: 3, rotation: 0 } );
		const rotated = cropperReducer( state, {
			type: 'SET_ROTATION',
			payload: 30,
		} );
		expect( rotated.zoom ).toBeGreaterThanOrEqual( 3 );
	} );

	it( 'small rotation ticks accumulate without drift', () => {
		// Simulate a slider going 0° → 45° in 9 ticks of 5°.
		// SET_ROTATION derives each tick from the fixed basePan (not
		// from the previous tick's potentially-clamped pan), so the
		// stepwise result matches a single 45° rotation exactly.
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.1, y: 0 },
		} );

		let stepwise = state;
		for ( let i = 1; i <= 9; i++ ) {
			stepwise = cropperReducer( stepwise, {
				type: 'SET_ROTATION',
				payload: i * 5,
			} );
		}

		const direct = cropperReducer( state, {
			type: 'SET_ROTATION',
			payload: 45,
		} );

		expect( stepwise.pan.x ).toBeCloseTo( direct.pan.x, 5 );
		expect( stepwise.pan.y ).toBeCloseTo( direct.pan.y, 5 );
	} );

	it( 'rotating away and back to 0° returns to the exact base pan', () => {
		// Regression test for accumulated-clamp drift: rotating 0° →
		// through various angles → 0° should land at the original
		// pan, even when panned near an edge where containment would
		// have clamped at intermediate angles.
		const state = makeState( {
			zoom: 2,
			pan: { x: 0.1, y: -0.05 },
		} );

		let result = state;
		for ( const angle of [ 10, 25, 40, 45, 30, 15, 0 ] ) {
			result = cropperReducer( result, {
				type: 'SET_ROTATION',
				payload: angle,
			} );
		}

		expect( result.pan.x ).toBeCloseTo( state.pan.x, 5 );
		expect( result.pan.y ).toBeCloseTo( state.pan.y, 5 );
		expect( result.zoom ).toBeCloseTo( state.zoom, 5 );
	} );
} );
