/**
 * Render–Camera Bridge Tests
 *
 * The image cropper has two parallel code paths that must agree:
 *
 * 1. **Render path** — manual cos/sin math in `computeTransformStyle`
 *    (CSS matrix) and stencil positioning (offset + cropRect × visualSize).
 *    This is what the user sees on screen.
 *
 * 2. **Camera path** — `createCamera` builds a `mat2d` matrix used by
 *    `restrictPanZoom` and `getSourceRegion` to enforce containment and
 *    compute export coordinates.
 *
 * If either path changes without updating the other, the image will
 * appear to cover the crop area on screen but the restriction says it
 * doesn't (or vice versa). These tests catch that drift by computing
 * the same positions through both paths and asserting they agree.
 *
 * If you change:
 *   - `computeTransformStyle` (transform-style.ts)
 *   - `createCamera` (camera.ts)
 *   - Stencil positioning formula (rectangle-stencil.tsx)
 *   - `getImageFit` (camera.ts)
 *
 * ...run these tests to verify the two paths still agree.
 */
import {
	createCamera,
	worldToScreen,
	getImageFit,
	getVisibleBounds,
} from '../camera';
import { computeTransformStyle } from '../transform-style';
import { DEFAULT_STATE } from '../constants';
import type { CropperState, Size } from '../types';

const CONTAINER: Size = { width: 800, height: 600 };
const IMAGE: Size = { width: 1600, height: 900 };

/**
 * Create a test state with an image loaded.
 *
 * @param overrides Partial state overrides.
 * @return A complete CropperState with image set.
 */
function makeState( overrides: Partial< CropperState > = {} ): CropperState {
	return {
		...DEFAULT_STATE,
		image: {
			src: 'test.jpg',
			naturalWidth: IMAGE.width,
			naturalHeight: IMAGE.height,
		},
		...overrides,
	};
}

/**
 * Compute the stencil corner positions using the render path.
 *
 * This replicates the exact math from rectangle-stencil.tsx:
 *   offsetX = (containerW - visualW) / 2
 *   left = offsetX + cropRect.x * visualW
 *   top = offsetY + cropRect.y * visualH
 *
 * @param state         The cropper state.
 * @param containerSize The container dimensions.
 * @param imageSize     The natural image dimensions.
 * @return The four stencil corners in screen pixels.
 */
function stencilCornersViaCssPath(
	state: CropperState,
	containerSize: Size,
	imageSize: Size
): { x: number; y: number }[] {
	const { visualSize } = getImageFit(
		containerSize,
		imageSize,
		state.rotation
	);
	const offsetX = ( containerSize.width - visualSize.width ) / 2;
	const offsetY = ( containerSize.height - visualSize.height ) / 2;
	const cr = state.cropRect;

	return [
		{
			x: offsetX + cr.x * visualSize.width,
			y: offsetY + cr.y * visualSize.height,
		},
		{
			x: offsetX + ( cr.x + cr.width ) * visualSize.width,
			y: offsetY + cr.y * visualSize.height,
		},
		{
			x: offsetX + ( cr.x + cr.width ) * visualSize.width,
			y: offsetY + ( cr.y + cr.height ) * visualSize.height,
		},
		{
			x: offsetX + cr.x * visualSize.width,
			y: offsetY + ( cr.y + cr.height ) * visualSize.height,
		},
	];
}

/**
 * Compute the stencil corner positions using the camera path.
 *
 * This replicates the exact math from restrictPanZoom in containment.ts:
 *   baseCamera = createCamera(state with zoom=1, pan=0)
 *   visibleBounds = getVisibleBounds(baseCamera)
 *   stencilX = visibleBounds.left + cropRect.x * visibleBounds.width
 *
 * @param state         The cropper state.
 * @param containerSize The container dimensions.
 * @param imageSize     The natural image dimensions.
 * @return The four stencil corners in screen pixels.
 */
function stencilCornersViaCameraPath(
	state: CropperState,
	containerSize: Size,
	imageSize: Size
): { x: number; y: number }[] {
	const baseCamera = createCamera(
		{ ...state, pan: { x: 0, y: 0 }, zoom: 1 },
		containerSize,
		imageSize
	);
	const vb = getVisibleBounds( baseCamera );
	const cr = state.cropRect;

	return [
		{
			x: vb.left + cr.x * vb.width,
			y: vb.top + cr.y * vb.height,
		},
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
}

/**
 * Compute where an image-center point ends up on screen using the
 * render path (the CSS matrix from computeTransformStyle).
 *
 * The CSS matrix is applied with transform-origin: center center,
 * relative to the element. The element is centered in the container.
 * So screen position = containerCenter + matrix × (point - elementCenter).
 *
 * @param state         The cropper state.
 * @param containerSize The container dimensions.
 * @param imageSize     The natural image dimensions.
 * @param normPoint     The point in normalized [0,1] image space.
 * @param normPoint.x   Horizontal coordinate (0 = left, 1 = right).
 * @param normPoint.y   Vertical coordinate (0 = top, 1 = bottom).
 * @return The screen pixel position.
 */
function pointViaCssPath(
	state: CropperState,
	containerSize: Size,
	imageSize: Size,
	normPoint: { x: number; y: number }
): { x: number; y: number } {
	const { elementSize, visualSize } = getImageFit(
		containerSize,
		imageSize,
		state.rotation
	);

	// computeTransformStyle receives visualSize (the rotated bounding box),
	// matching what cropper.tsx passes in production.
	const matrixStr = computeTransformStyle( state, visualSize );
	const match = matrixStr.match(
		/matrix\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/
	);
	const [ , a, b, c, d, tx, ty ] = match!.map( Number );

	// The point in rendered-pixel space (relative to element origin).
	const px = normPoint.x * elementSize.width;
	const py = normPoint.y * elementSize.height;

	// CSS transform-origin is element center.
	const cx = elementSize.width / 2;
	const cy = elementSize.height / 2;

	// Apply the matrix around the center origin, then translate
	// to container center (where the element is positioned).
	const dx = px - cx;
	const dy = py - cy;
	return {
		x: containerSize.width / 2 + a * dx + c * dy + tx,
		y: containerSize.height / 2 + b * dx + d * dy + ty,
	};
}

/**
 * Compute where an image point ends up on screen using the camera path.
 *
 * @param state         The cropper state.
 * @param containerSize The container dimensions.
 * @param imageSize     The natural image dimensions.
 * @param normPoint     The point in normalized [0,1] image space.
 * @param normPoint.x   Horizontal coordinate (0 = left, 1 = right).
 * @param normPoint.y   Vertical coordinate (0 = top, 1 = bottom).
 * @return The screen pixel position.
 */
function pointViaCameraPath(
	state: CropperState,
	containerSize: Size,
	imageSize: Size,
	normPoint: { x: number; y: number }
): { x: number; y: number } {
	const camera = createCamera( state, containerSize, imageSize );
	return worldToScreen( camera, normPoint );
}

describe( 'Render–Camera bridge: stencil positioning', () => {
	// Stencil positioning uses the snapped rotation for layout (see
	// getImageFit), which matches the camera path at 90° multiples but
	// diverges during fine rotation (±15°, ±30°, etc.). The CSS stencil
	// stays put while the image visibly rotates behind it — this is the
	// fixed-stencil layout. Only the snap-multiple angles are expected
	// to have exact agreement between the two paths.
	const SNAP_ROTATIONS = [ 0, 90, 180, 270 ];
	const CROP_RECTS = [
		{ x: 0, y: 0, width: 1, height: 1 },
		{ x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
		{ x: 0.25, y: 0.3, width: 0.5, height: 0.4 },
	];

	for ( const rotation of SNAP_ROTATIONS ) {
		for ( const cropRect of CROP_RECTS ) {
			const label = `rotation=${ rotation }° crop=${ cropRect.width }×${ cropRect.height }`;
			it( `stencil corners agree at ${ label }`, () => {
				const state = makeState( { rotation, cropRect } );
				const stencilCorners = stencilCornersViaCssPath(
					state,
					CONTAINER,
					IMAGE
				);
				const cameraCorners = stencilCornersViaCameraPath(
					state,
					CONTAINER,
					IMAGE
				);

				for ( let i = 0; i < 4; i++ ) {
					expect( stencilCorners[ i ].x ).toBeCloseTo(
						cameraCorners[ i ].x,
						1
					);
					expect( stencilCorners[ i ].y ).toBeCloseTo(
						cameraCorners[ i ].y,
						1
					);
				}
			} );
		}
	}
} );

describe( 'Render–Camera bridge: image point projection', () => {
	const TEST_POINTS = [
		{ x: 0, y: 0 },
		{ x: 0.5, y: 0.5 },
		{ x: 1, y: 1 },
		{ x: 0.25, y: 0.75 },
	];
	const TEST_STATES = [
		{ label: 'identity', overrides: {} },
		{ label: 'zoom=2', overrides: { zoom: 2 } },
		{
			label: 'rotation=30 zoom=1.5',
			overrides: { rotation: 30, zoom: 1.5 },
		},
		{
			label: 'flip-h rotation=45',
			overrides: {
				flip: { horizontal: true, vertical: false },
				rotation: 45,
			},
		},
		{
			label: 'pan + zoom + rotation',
			overrides: {
				pan: { x: 0.05, y: -0.03 },
				zoom: 2,
				rotation: 15,
			},
		},
	];

	for ( const { label, overrides } of TEST_STATES ) {
		for ( const point of TEST_POINTS ) {
			it( `(${ point.x },${ point.y }) agrees at ${ label }`, () => {
				const state = makeState( overrides );
				const cssPos = pointViaCssPath(
					state,
					CONTAINER,
					IMAGE,
					point
				);
				const cameraPos = pointViaCameraPath(
					state,
					CONTAINER,
					IMAGE,
					point
				);

				expect( cssPos.x ).toBeCloseTo( cameraPos.x, 0 );
				expect( cssPos.y ).toBeCloseTo( cameraPos.y, 0 );
			} );
		}
	}
} );

describe( 'Render–Camera bridge: visual size consistency', () => {
	it( 'getImageFit visualSize matches getVisibleBounds dimensions at snap angles', () => {
		// At fine rotation (15°, 30°, etc.) the image footprint AABB
		// inflates beyond the snapped visual box, so visualSize (which
		// snaps) and getVisibleBounds (which sees actual rotated corners)
		// diverge by design. They must still agree at snap multiples.
		const SNAP_ROTATIONS = [ 0, 90, 180, 270 ];

		for ( const rotation of SNAP_ROTATIONS ) {
			const state = makeState( { rotation } );
			const { visualSize } = getImageFit( CONTAINER, IMAGE, rotation );
			const baseCamera = createCamera(
				{ ...state, pan: { x: 0, y: 0 }, zoom: 1 },
				CONTAINER,
				IMAGE
			);
			const vb = getVisibleBounds( baseCamera );

			expect( visualSize.width ).toBeCloseTo( vb.width, 0 );
			expect( visualSize.height ).toBeCloseTo( vb.height, 0 );
		}
	} );
} );
