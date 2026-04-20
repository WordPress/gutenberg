/**
 * External dependencies
 */
import { mat2d, vec2 } from 'gl-matrix';

/**
 * Internal dependencies
 */
import type {
	CropperState,
	NormalizedPoint,
	NormalizedRect,
	Size,
	Camera,
} from './types';
import { degreesToRadians } from './math/rotation';

/** Floating-point epsilon for "close enough to equal" comparisons. */
const EPSILON = 1e-9;

// Pre-allocated scratch buffers for hot-path functions (restrictPanZoom,
// screenToWorld, etc.) to avoid Float32Array allocation on every call.
// These are module-level singletons — safe because all usage is synchronous.
const _scratchMat = mat2d.create();
const _scratchVec = vec2.create();

/**
 * Compute the axis-aligned bounding box of a rectangle after rotation.
 *
 * @param width    The width of the rectangle.
 * @param height   The height of the rectangle.
 * @param rotation The rotation angle in degrees.
 * @return The bounding box size after rotation.
 */
export function getRotatedBBox(
	width: number,
	height: number,
	rotation: number
): Size {
	const rad = degreesToRadians( rotation );
	const cosR = Math.abs( Math.cos( rad ) );
	const sinR = Math.abs( Math.sin( rad ) );
	return {
		width: cosR * width + sinR * height,
		height: sinR * width + cosR * height,
	};
}

/**
 * Compute the fitted (unrotated) image element dimensions and the visual
 * (rotated) bounding box dimensions for a given container, image, and rotation.
 *
 * This is the same "contain" fit logic used by createCamera, extracted so
 * cropper.tsx can size the <img> element and position overlays without
 * duplicating the math.
 *
 * @param containerSize The container dimensions in pixels.
 * @param imageSize     The natural image dimensions in pixels.
 * @param rotation      The rotation angle in degrees.
 * @return The fitted element size and visual bounding box size.
 */
export function getImageFit(
	containerSize: Size,
	imageSize: Size,
	rotation: number
): { elementSize: Size; visualSize: Size } {
	if (
		containerSize.width === 0 ||
		containerSize.height === 0 ||
		imageSize.width === 0 ||
		imageSize.height === 0
	) {
		return {
			elementSize: { width: 0, height: 0 },
			visualSize: { width: 0, height: 0 },
		};
	}
	// Snap rotation to the nearest 90° multiple for layout sizing.
	// This keeps the stencil a stable size through fine ±45° rotation
	// (no inflation at 15°/30° etc.) while still swapping aspect at
	// 90°/180°/270° so the snap rotate preserves the framed content.
	const snapRotation = Math.round( rotation / 90 ) * 90;
	const naturalBBox = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);
	const fitScale = Math.min(
		containerSize.width / naturalBBox.width,
		containerSize.height / naturalBBox.height
	);
	const renderedW = imageSize.width * fitScale;
	const renderedH = imageSize.height * fitScale;
	const visualSize = getRotatedBBox( renderedW, renderedH, snapRotation );
	return {
		elementSize: { width: renderedW, height: renderedH },
		visualSize,
	};
}

/**
 * Compose a camera matrix from cropper state, container, and image dimensions.
 *
 * The matrix maps normalized world coordinates [0,1] x [0,1] to screen pixels.
 * Input (0,0) = image top-left, (1,1) = image bottom-right.
 *
 * Composition order (left-to-right = outermost first, applied last to point):
 *   M = T_containerCenter * T_pan * S_flip * R_rotation * S_zoom * T_center * S_toRenderedPixels
 *
 * Flip is composed outside rotation, so `flip.horizontal` / `flip.vertical`
 * are viewport-relative: the image mirrors across the viewport's vertical /
 * horizontal axis regardless of current rotation.
 *
 * @param state         The current cropper state (zoom, rotation, flip, crop).
 * @param containerSize The size of the container in pixels.
 * @param imageSize     The natural size of the image in pixels.
 * @return The composed camera matrix.
 */
export function createCamera(
	state: CropperState,
	containerSize: Size,
	imageSize: Size
): Camera {
	const m = mat2d.create();

	if (
		containerSize.width === 0 ||
		containerSize.height === 0 ||
		imageSize.width === 0 ||
		imageSize.height === 0
	) {
		return m;
	}

	// Use the nearest 90° multiple for layout sizing so the stencil
	// and visual bounds are stable through fine rotation. The actual
	// `state.rotation` is still used for the rotation component of
	// the matrix below.
	const snapRotation = Math.round( state.rotation / 90 ) * 90;

	// Rotated bounding box of the natural image (at snap angle).
	const naturalBBox = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);

	// "Contain" fit: scale rotated bounding box to fit within container.
	const fitScale = Math.min(
		containerSize.width / naturalBBox.width,
		containerSize.height / naturalBBox.height
	);

	// The rendered (unrotated) image dimensions at this fit scale.
	const renderedW = imageSize.width * fitScale;
	const renderedH = imageSize.height * fitScale;

	// Visual (rotated) image footprint in pixels (at snap angle).
	const { width: visualW, height: visualH } = getRotatedBBox(
		renderedW,
		renderedH,
		snapRotation
	);

	// Build matrix left-to-right (outermost first).
	// Innermost operations (last in code) are applied first to input point.

	// Outermost: translate to container center.
	mat2d.translate( m, m, [
		containerSize.width / 2,
		containerSize.height / 2,
	] );

	// Pan offset in visual-space pixels.
	mat2d.translate( m, m, [ state.pan.x * visualW, state.pan.y * visualH ] );

	// Flip (viewport-relative — composed outside rotation so horizontal
	// flip always mirrors across the viewport's vertical axis).
	mat2d.scale( m, m, [
		state.flip.horizontal ? -1 : 1,
		state.flip.vertical ? -1 : 1,
	] );

	// Rotate.
	mat2d.rotate( m, m, degreesToRadians( state.rotation ) );

	// Zoom.
	mat2d.scale( m, m, [ state.zoom, state.zoom ] );

	// Center origin (shift so 0.5,0.5 in rendered-pixel space = origin).
	mat2d.translate( m, m, [ -renderedW / 2, -renderedH / 2 ] );

	// Innermost: scale from normalized [0,1] to rendered pixels.
	mat2d.scale( m, m, [ renderedW, renderedH ] );

	return m;
}

/**
 * Transform a normalized world point [0,1] to screen pixels.
 *
 * @param camera The camera matrix from createCamera.
 * @param point  The normalized world coordinate to transform.
 * @return The screen pixel coordinate.
 */
export function worldToScreen(
	camera: Camera,
	point: NormalizedPoint
): { x: number; y: number } {
	const out = vec2.create();
	vec2.transformMat2d( out, [ point.x, point.y ], camera );
	return { x: out[ 0 ], y: out[ 1 ] };
}

/**
 * Transform a screen pixel point to normalized world coordinates [0,1].
 *
 * @param camera  The camera matrix from createCamera.
 * @param point   The screen pixel coordinate to transform.
 * @param point.x The x component of the screen pixel coordinate.
 * @param point.y The y component of the screen pixel coordinate.
 * @return The normalized world coordinate.
 */
export function screenToWorld(
	camera: Camera,
	point: { x: number; y: number }
): NormalizedPoint {
	mat2d.invert( _scratchMat, camera );
	const out = _scratchVec;
	vec2.transformMat2d( out, [ point.x, point.y ], _scratchMat );
	return { x: out[ 0 ], y: out[ 1 ] };
}

/**
 * The bounding box of a transformed region in screen (pixel) space.
 */
export interface VisualBounds {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * Compute the axis-aligned bounding box of a set of corners after
 * transforming them through a camera matrix.
 *
 * @param camera  The camera matrix from createCamera.
 * @param corners The corners to transform (each as [x, y]).
 * @return The screen-space bounding box.
 */
function aabb( camera: Camera, corners: [ number, number ][] ): VisualBounds {
	const screenCorners = corners.map( ( c ) => {
		const out = vec2.create();
		vec2.transformMat2d( out, c, camera );
		return out;
	} );
	let minX = screenCorners[ 0 ][ 0 ];
	let maxX = screenCorners[ 0 ][ 0 ];
	let minY = screenCorners[ 0 ][ 1 ];
	let maxY = screenCorners[ 0 ][ 1 ];
	for ( let i = 1; i < screenCorners.length; i++ ) {
		const s = screenCorners[ i ];
		if ( s[ 0 ] < minX ) {
			minX = s[ 0 ];
		}
		if ( s[ 0 ] > maxX ) {
			maxX = s[ 0 ];
		}
		if ( s[ 1 ] < minY ) {
			minY = s[ 1 ];
		}
		if ( s[ 1 ] > maxY ) {
			maxY = s[ 1 ];
		}
	}
	return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Returns the axis-aligned bounding box of the full image (normalized [0,1]x[0,1])
 * after applying the camera transform.
 *
 * @param camera The camera matrix from createCamera.
 * @return The screen-space bounding box of the full image.
 */
export function getVisibleBounds( camera: Camera ): VisualBounds {
	return aabb( camera, [
		[ 0, 0 ],
		[ 1, 0 ],
		[ 1, 1 ],
		[ 0, 1 ],
	] );
}

/**
 * Compute the visual (rotated) bounding-box dimensions in pixel-proportional
 * units where the unrotated image is `a × 1` (renderedW = a, renderedH = 1).
 *
 * @param rotation         Rotation angle in degrees.
 * @param imageAspectRatio Image width / height ratio.
 * @return Visual dimensions and trig helpers.
 */
function getVisualDimensions(
	rotation: number,
	imageAspectRatio: number
): { visualW: number; visualH: number; absC: number; absS: number } {
	const rad = degreesToRadians( rotation );
	const absC = Math.abs( Math.cos( rad ) );
	const absS = Math.abs( Math.sin( rad ) );
	const bbox = getRotatedBBox( imageAspectRatio, 1, rotation );
	return {
		visualW: bbox.width,
		visualH: bbox.height,
		absC,
		absS,
	};
}

/**
 * Calculates the minimum zoom factor needed for the rotated image to fully cover
 * the crop rectangle, using normalized coordinates and imageAspectRatio.
 *
 * Works in pixel-proportional space where the unrotated image is a×1.
 * The crop rect is in visual-normalized space and must be scaled by the
 * rotation-dependent visual dimensions before projecting into the image-local
 * frame.
 *
 * @param rotation         Rotation angle in degrees.
 * @param imageAspectRatio Image width / height ratio.
 * @param cropRect         The crop rectangle in normalized coordinates.
 * @return The minimum zoom factor (always >= 1).
 */
function getMinZoomForCover(
	rotation: number,
	imageAspectRatio: number,
	cropRect: NormalizedRect
): number {
	const aspectRatio = Math.max( imageAspectRatio, Number.EPSILON );
	const { visualW, visualH, absC, absS } = getVisualDimensions(
		rotation,
		aspectRatio
	);

	// Crop half-extents in pixel-proportional space.
	const cropHalfW = ( cropRect.width * visualW ) / 2;
	const cropHalfH = ( cropRect.height * visualH ) / 2;

	// AABB of the crop rect projected into the image-local (unrotated) frame.
	const spanAlpha = cropHalfW * absC + cropHalfH * absS;
	const spanBeta = cropHalfW * absS + cropHalfH * absC;

	// Image half-extents at zoom z: (aspectRatio*z/2, z/2).
	// Coverage requires: aspectRatio*z/2 >= spanAlpha  AND  z/2 >= spanBeta.
	const zoomFromAlpha = ( 2 * spanAlpha ) / aspectRatio;
	const zoomFromBeta = 2 * spanBeta;

	return Math.max( 1, zoomFromAlpha, zoomFromBeta );
}

/**
 * Compute the crop handle bounds in normalized visual space by finding the
 * axis-aligned bounding box (AABB) of the actual image footprint at the
 * current pan/zoom/rotation, then intersecting with the container viewport.
 *
 * Unlike a static centerline-based calculation, this accounts for the
 * current pan position — if the user pans right, the left bound tightens
 * because the image's left edge has moved right.
 *
 * @param state         The current cropper state (crop, zoom, rotation, flip).
 * @param elementSize   The fitted (unrotated) image element dimensions in pixels.
 * @param visualSize    The visual (rotated) image bounding box in pixels.
 * @param containerSize The container dimensions in pixels.
 * @return The min/max x and y that a crop rect edge can reach in normalized space.
 */
export function getCropBounds(
	state: CropperState,
	elementSize: Size,
	visualSize: Size,
	containerSize: Size
): { minX: number; minY: number; maxX: number; maxY: number } {
	if (
		elementSize.width === 0 ||
		elementSize.height === 0 ||
		visualSize.width === 0 ||
		visualSize.height === 0
	) {
		return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
	}

	// Build the same CSS matrix as use-transform-style: flip * rotate * zoom.
	// Flip is outside rotation so it acts in viewport axes (see createCamera).
	const tx = state.pan.x * visualSize.width;
	const ty = state.pan.y * visualSize.height;
	const rad = degreesToRadians( state.rotation );
	const cos = Math.cos( rad );
	const sin = Math.sin( rad );
	const sx = state.flip.horizontal ? -1 : 1;
	const sy = state.flip.vertical ? -1 : 1;
	const z = state.zoom;
	const ma = sx * cos * z;
	const mb = sy * sin * z;
	const mc = -sx * sin * z;
	const md = sy * cos * z;

	// Image element corners relative to element center.
	const hw = elementSize.width / 2;
	const hh = elementSize.height / 2;
	const corners = [
		[ -hw, -hh ],
		[ hw, -hh ],
		[ hw, hh ],
		[ -hw, hh ],
	];

	// Transform corners through CSS matrix → screen offsets from element center.
	// Screen position = element_center + transformed_offset.
	// Element center is at (containerW/2, containerH/2) after CSS centering.
	// But we want normalized coords, so work relative to the visual image origin.
	const offsetX = ( containerSize.width - visualSize.width ) / 2;
	const offsetY = ( containerSize.height - visualSize.height ) / 2;

	let imgMinX = Infinity;
	let imgMaxX = -Infinity;
	let imgMinY = Infinity;
	let imgMaxY = -Infinity;

	for ( const [ cx, cy ] of corners ) {
		// Screen offset from element center after CSS matrix.
		const screenX = ma * cx + mc * cy + tx;
		const screenY = mb * cx + md * cy + ty;
		// Convert to normalized visual space.
		// The element center is at the visual image center, which is at
		// normalized (0.5, 0.5). So screen offset / visualSize + 0.5.
		const nx = screenX / visualSize.width + 0.5;
		const ny = screenY / visualSize.height + 0.5;
		imgMinX = Math.min( imgMinX, nx );
		imgMaxX = Math.max( imgMaxX, nx );
		imgMinY = Math.min( imgMinY, ny );
		imgMaxY = Math.max( imgMaxY, ny );
	}

	// Container bounds in normalized space.
	const containerMinX = -offsetX / visualSize.width;
	const containerMaxX = ( containerSize.width - offsetX ) / visualSize.width;
	const containerMinY = -offsetY / visualSize.height;
	const containerMaxY =
		( containerSize.height - offsetY ) / visualSize.height;

	// Crop bounds = intersection of image AABB and container bounds.
	return {
		minX: Math.max( imgMinX, containerMinX ),
		minY: Math.max( imgMinY, containerMinY ),
		maxX: Math.min( imgMaxX, containerMaxX ),
		maxY: Math.min( imgMaxY, containerMaxY ),
	};
}

/**
 * Restricts a crop rectangle so that the rotated, zoomed image can fully cover it.
 * If the crop rect is too large for the current zoom and rotation, it is scaled
 * down proportionally and re-centered.
 *
 * Works in pixel-proportional space where the unrotated image is a×1.
 *
 * @param cropRect         The crop rectangle in normalized coordinates.
 * @param zoom             The current zoom factor.
 * @param rotation         The rotation angle in degrees.
 * @param imageAspectRatio The image width / height ratio.
 * @return The restricted crop rectangle.
 */
export function restrictCropRect(
	cropRect: NormalizedRect,
	zoom: number,
	rotation: number,
	imageAspectRatio: number
): NormalizedRect {
	const aspectRatio = Math.max( imageAspectRatio, Number.EPSILON );
	const { visualW, visualH, absC, absS } = getVisualDimensions(
		rotation,
		aspectRatio
	);
	const W = cropRect.width;
	const H = cropRect.height;

	// Crop full-extents in pixel-proportional space, projected to image-local frame.
	const cropWPx = W * visualW;
	const cropHPx = H * visualH;
	const spanAlpha = cropWPx * absC + cropHPx * absS;
	const spanBeta = cropWPx * absS + cropHPx * absC;

	// Image full-extents at zoom z: (aspectRatio*z, z).
	const limitAlpha = aspectRatio * zoom;
	const limitBeta = zoom;

	let t = 1;
	if ( spanAlpha > 0 ) {
		t = Math.min( t, limitAlpha / spanAlpha );
	}
	if ( spanBeta > 0 ) {
		t = Math.min( t, limitBeta / spanBeta );
	}
	if ( t >= 1 - EPSILON ) {
		// Crop fits at the current zoom — no size change needed.
		// Position is handled by restrictPanZoom, not here.
		return cropRect;
	}
	const newW = W * t;
	const newH = H * t;
	const centerX = cropRect.x + W / 2;
	const centerY = cropRect.y + H / 2;
	let newX = centerX - newW / 2;
	let newY = centerY - newH / 2;
	newX = Math.max( 0, Math.min( newX, 1 - newW ) );
	newY = Math.max( 0, Math.min( newY, 1 - newH ) );
	return { x: newX, y: newY, width: newW, height: newH };
}

/**
 * Canonical container used internally by restrictPanZoom.
 * Containment is scale-invariant, so the actual size doesn't matter —
 * only the relative geometry between stencil and image matters.
 */
const CANONICAL_CONTAINER: Size = { width: 1000, height: 1000 };

/**
 * Clamps pan and adjusts zoom so that the zoomed, rotated image fully covers
 * the crop rectangle.
 *
 * Uses the camera matrix to project: builds a camera from the candidate state,
 * maps the stencil corners (axis-aligned in the visual bounding box) to world
 * space via the inverse camera, and checks that all world points lie within
 * [0,1]×[0,1]. If any point is outside, computes the minimal pan correction.
 *
 * @param state     The current cropper state.
 * @param imageSize The natural size of the image in pixels.
 * @param cropRect  The crop rectangle in normalized coordinates.
 * @return The restricted crop pan and zoom values.
 */
export function restrictPanZoom(
	state: CropperState,
	imageSize: Size,
	cropRect: NormalizedRect
): { pan: { x: number; y: number }; zoom: number } {
	// Algorithm overview:
	// 1. Ensure zoom is high enough for the rotated image to cover the crop.
	// 2. Build a camera (world→screen matrix) with the candidate state.
	// 3. Build a base camera (no pan, zoom=1) to find where the stencil
	//    sits in screen space — the stencil is anchored to the container,
	//    not the image, so it doesn't move with pan or scale with zoom.
	// 4. Project the 4 stencil corners through the INVERSE of the main
	//    camera to get world-space positions. A world point outside [0,1]
	//    means that corner of the stencil isn't covered by the image.
	// 5. Compute the minimal translation in world space to push all corners
	//    back inside [0,1].
	// 6. Convert the world-space correction to a pan-field correction by
	//    mapping it through the camera's linear part back to screen space,
	//    then dividing by the visual bounds.
	const aspectRatio =
		imageSize.width > 0 && imageSize.height > 0
			? imageSize.width / imageSize.height
			: 1;
	const minZoom = getMinZoomForCover( state.rotation, aspectRatio, cropRect );
	const zoom = Math.max( state.zoom, minZoom );

	// Step 2: build camera with candidate pan and corrected zoom.
	const candidateState = { ...state, zoom };
	const camera = createCamera(
		candidateState,
		CANONICAL_CONTAINER,
		imageSize
	);

	// Build a base camera (zero pan, zoom=1) to get stencil positions.
	// The stencil is anchored to the container and laid out using the
	// nearest 90° rotation (matching `getImageFit`), so it's stable
	// through fine rotation. CSS zoom only affects the <img> element,
	// not the stencil.
	const snapRotation = Math.round( state.rotation / 90 ) * 90;
	const baseCamera = createCamera(
		{
			...candidateState,
			pan: { x: 0, y: 0 },
			zoom: 1,
			rotation: snapRotation,
		},
		CANONICAL_CONTAINER,
		imageSize
	);
	const visibleBounds = getVisibleBounds( baseCamera );

	// Stencil corners in screen space (axis-aligned rect within visual bounds).
	const stencilCorners: [ number, number ][] = [
		[
			visibleBounds.left + cropRect.x * visibleBounds.width,
			visibleBounds.top + cropRect.y * visibleBounds.height,
		],
		[
			visibleBounds.left +
				( cropRect.x + cropRect.width ) * visibleBounds.width,
			visibleBounds.top + cropRect.y * visibleBounds.height,
		],
		[
			visibleBounds.left +
				( cropRect.x + cropRect.width ) * visibleBounds.width,
			visibleBounds.top +
				( cropRect.y + cropRect.height ) * visibleBounds.height,
		],
		[
			visibleBounds.left + cropRect.x * visibleBounds.width,
			visibleBounds.top +
				( cropRect.y + cropRect.height ) * visibleBounds.height,
		],
	];

	// Map stencil corners to world space via inverse camera.
	// If a world point is outside [0,1], the image doesn't cover that spot.
	// Reuse module-level scratch buffers to avoid allocation per frame.
	mat2d.invert( _scratchMat, camera );

	let minWx = Infinity;
	let maxWx = -Infinity;
	let minWy = Infinity;
	let maxWy = -Infinity;

	for ( const corner of stencilCorners ) {
		vec2.transformMat2d( _scratchVec, corner, _scratchMat );
		const w = _scratchVec;
		if ( w[ 0 ] < minWx ) {
			minWx = w[ 0 ];
		}
		if ( w[ 0 ] > maxWx ) {
			maxWx = w[ 0 ];
		}
		if ( w[ 1 ] < minWy ) {
			minWy = w[ 1 ];
		}
		if ( w[ 1 ] > maxWy ) {
			maxWy = w[ 1 ];
		}
	}

	// If all world points are in [0,1], no correction needed.
	if (
		minWx >= -EPSILON &&
		maxWx <= 1 + EPSILON &&
		minWy >= -EPSILON &&
		maxWy <= 1 + EPSILON
	) {
		return { pan: state.pan, zoom };
	}

	// Compute world-space correction needed.
	// If minWx < 0, we need to shift world points right by |minWx|.
	// If maxWx > 1, we need to shift world points left by (maxWx - 1).
	// If both, we're over-constrained (crop too big) — getMinZoomForCover
	// should have prevented this.
	let dwx = 0;
	let dwy = 0;

	if ( minWx < 0 && maxWx <= 1 + EPSILON ) {
		dwx = -minWx;
	} else if ( maxWx > 1 && minWx >= -EPSILON ) {
		dwx = 1 - maxWx;
	} else if ( minWx < 0 && maxWx > 1 ) {
		// Over-constrained: center it.
		dwx = ( 1 - maxWx - minWx ) / 2;
	}

	if ( minWy < 0 && maxWy <= 1 + EPSILON ) {
		dwy = -minWy;
	} else if ( maxWy > 1 && minWy >= -EPSILON ) {
		dwy = 1 - maxWy;
	} else if ( minWy < 0 && maxWy > 1 ) {
		dwy = ( 1 - maxWy - minWy ) / 2;
	}

	// Convert world-space correction to screen-space correction.
	// The camera's 2×2 linear part (indices [0,1,2,3]) maps world deltas
	// to screen deltas: screenDelta = linear * worldDelta.
	const dsx = camera[ 0 ] * dwx + camera[ 2 ] * dwy;
	const dsy = camera[ 1 ] * dwx + camera[ 3 ] * dwy;

	// Convert screen-space correction to pan-field correction.
	// Pan in screen pixels = pan.x * visualW, pan.y * visualH.
	// The correction is subtractive: a positive world shift (dw > 0) means
	// the image needs to move opposite to pan direction, so pan decreases.
	const newPanX =
		state.pan.x -
		( visibleBounds.width > 0 ? dsx / visibleBounds.width : 0 );
	const newPanY =
		state.pan.y -
		( visibleBounds.height > 0 ? dsy / visibleBounds.height : 0 );

	return {
		pan: { x: newPanX, y: newPanY },
		zoom,
	};
}

/**
 * Compose a camera matrix for exporting to a canvas.
 *
 * The resulting matrix maps image-pixel coordinates directly to output-canvas
 * coordinates. Apply it with `ctx.setTransform( ...camera )` then
 * `ctx.drawImage( image, 0, 0 )`.
 *
 * The transform chain mirrors the `renderToCanvas` function in canvas-renderer.ts:
 *   translate(visualCenter - cropOffset + outCenter) → rotate → flip+zoom → translate(-imgCenter)
 *
 * @param state      The current cropper state.
 * @param imageSize  The natural size of the source image in pixels.
 * @param outputSize The desired output canvas size in pixels.
 * @return The composed export camera matrix.
 */
export function createExportCamera(
	state: CropperState,
	imageSize: Size,
	outputSize: Size
): Camera {
	const m = mat2d.create();
	const { rotation, flip, cropRect, zoom, pan } = state;
	if (
		imageSize.width === 0 ||
		imageSize.height === 0 ||
		outputSize.width === 0 ||
		outputSize.height === 0
	) {
		return m;
	}
	// Reference frame for cropRect/pan is the snap-rotation bbox — that's
	// what the stencil and CSS matrix use in the preview (see createCamera
	// and getImageFit). Using the true rotation here would position the
	// crop window at a different offset than the stencil framed, and show
	// a shifted region after any fine rotation.
	const snapRotation = Math.round( rotation / 90 ) * 90;
	const { width: rotW, height: rotH } = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);

	// Scale factor to map the natural crop region to the output canvas size.
	const naturalCropW = cropRect.width * rotW;
	const naturalCropH = cropRect.height * rotH;
	const outputScaleX = naturalCropW > 0 ? outputSize.width / naturalCropW : 1;
	const outputScaleY =
		naturalCropH > 0 ? outputSize.height / naturalCropH : 1;

	const cropOffsetX = cropRect.x * rotW + outputSize.width / 2 / outputScaleX;
	const cropOffsetY =
		cropRect.y * rotH + outputSize.height / 2 / outputScaleY;
	const visualCenterX = rotW / 2 + pan.x * rotW;
	const visualCenterY = rotH / 2 + pan.y * rotH;
	mat2d.scale( m, m, [ outputScaleX, outputScaleY ] );
	mat2d.translate( m, m, [
		visualCenterX - cropOffsetX + outputSize.width / 2 / outputScaleX,
		visualCenterY - cropOffsetY + outputSize.height / 2 / outputScaleY,
	] );
	// Flip is composed outside rotation so it acts in viewport/output space —
	// must match createCamera's order for preview and export to agree.
	mat2d.scale( m, m, [ flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1 ] );
	mat2d.rotate( m, m, degreesToRadians( rotation ) );
	mat2d.scale( m, m, [ zoom, zoom ] );
	mat2d.translate( m, m, [ -imageSize.width / 2, -imageSize.height / 2 ] );
	return m;
}

/**
 * The selected image region in source-pixel coordinates.
 */
export interface SourceRegion {
	/** X offset in source pixels. */
	x: number;
	/** Y offset in source pixels. */
	y: number;
	/** Width in source pixels. */
	width: number;
	/** Height in source pixels. */
	height: number;
	/** Rotation in degrees (0-360). */
	rotation: number;
	/** Flip state. */
	flip: { horizontal: boolean; vertical: boolean };
	/** Zoom factor applied. */
	zoom: number;
}

/**
 * Get the selected image region in source-pixel coordinates.
 *
 * Converts the current crop state (normalized visual space) to the actual
 * region of the original image that's selected. This is the bridge between
 * the cropper's internal coordinate system and external tools (image
 * processing libraries, AI APIs, server-side processing) that work in
 * source-pixel coordinates.
 *
 * The returned rectangle accounts for pan, zoom, and the crop rect position,
 * but expresses the crop in the unrotated image's coordinate space. Rotation
 * and flip are included as separate fields since they represent transforms,
 * not a region.
 *
 * @param state     The current cropper state.
 * @param imageSize The natural dimensions of the source image.
 * @return The selected region in source pixels plus rotation/flip metadata.
 */
export function getSourceRegion(
	state: CropperState,
	imageSize: Size
): SourceRegion {
	if ( imageSize.width === 0 || imageSize.height === 0 ) {
		return {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			rotation: state.rotation,
			flip: { ...state.flip },
			zoom: state.zoom,
		};
	}

	// Use a synthetic 1:1 container so the camera maps normalized coords
	// to a known pixel space. The container size cancels out.
	const syntheticContainer: Size = { width: 1000, height: 1000 };
	const camera = createCamera( state, syntheticContainer, imageSize );

	// Inverse camera maps screen pixels back to normalized [0,1] world coords.
	const inv = mat2d.create();
	mat2d.invert( inv, camera );

	// The crop rect center in screen space. We need the base camera
	// (zoom=1, no pan) to locate the visual bounds, then place the
	// crop rect within them.
	const baseCamera = createCamera(
		{ ...state, pan: { x: 0, y: 0 }, zoom: 1 },
		syntheticContainer,
		imageSize
	);
	const visibleBounds = getVisibleBounds( baseCamera );

	const cropRect = state.cropRect;
	const cropCenterScreenX =
		visibleBounds.left +
		( cropRect.x + cropRect.width / 2 ) * visibleBounds.width;
	const cropCenterScreenY =
		visibleBounds.top +
		( cropRect.y + cropRect.height / 2 ) * visibleBounds.height;

	// Transform crop center through inverse camera to get source position.
	const srcCenter = vec2.create();
	vec2.transformMat2d(
		srcCenter,
		[ cropCenterScreenX, cropCenterScreenY ],
		inv
	);

	// Crop rect size in the snap-rotation visual space, divided by zoom
	// for source-pixel dimensions. Matches the stencil's reference frame.
	const snapRotation = Math.round( state.rotation / 90 ) * 90;
	const { width: rotW, height: rotH } = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);
	const sourceW = ( cropRect.width * rotW ) / state.zoom;
	const sourceH = ( cropRect.height * rotH ) / state.zoom;

	return {
		x: srcCenter[ 0 ] * imageSize.width - sourceW / 2,
		y: srcCenter[ 1 ] * imageSize.height - sourceH / 2,
		width: sourceW,
		height: sourceH,
		rotation: state.rotation,
		flip: { ...state.flip },
		zoom: state.zoom,
	};
}

/**
 * The selected crop region expressed as percentages of the source image.
 */
export interface SourceRegionPercent {
	/** X offset as a percentage (0–100) of the source image width. */
	x: number;
	/** Y offset as a percentage (0–100) of the source image height. */
	y: number;
	/** Width as a percentage (0–100) of the source image width. */
	width: number;
	/** Height as a percentage (0–100) of the source image height. */
	height: number;
}

/**
 * Get the selected image region as percentages of the source image dimensions.
 *
 * Returns `{ x, y, width, height }` where each value is a percentage (0–100)
 * of the source image's natural width or height. This format is compatible
 * with the WordPress REST API attachments `/edit` endpoint and CSS-based
 * crop workflows.
 *
 * Internally delegates to `getSourceRegion` and divides by the image
 * dimensions, so accuracy is identical.
 *
 * @param state     The current cropper state.
 * @param imageSize The natural dimensions of the source image.
 * @return The crop region as percentages (0–100).
 */
export function getSourceRegionPercent(
	state: CropperState,
	imageSize: Size
): SourceRegionPercent {
	if ( imageSize.width === 0 || imageSize.height === 0 ) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}
	const region = getSourceRegion( state, imageSize );
	return {
		x: ( region.x / imageSize.width ) * 100,
		y: ( region.y / imageSize.height ) * 100,
		width: ( region.width / imageSize.width ) * 100,
		height: ( region.height / imageSize.height ) * 100,
	};
}
