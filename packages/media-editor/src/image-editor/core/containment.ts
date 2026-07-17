/**
 * External dependencies
 */
import { mat2d, vec2 } from 'gl-matrix';

/**
 * Internal dependencies
 */
import type { CropperState, NormalizedRect, Size } from './types';
import { ABSOLUTE_MIN_ZOOM, MAX_ZOOM, MIN_ZOOM } from './constants';
import { degreesToRadians } from './math/rotation';
import {
	isValidSize,
	safeBoundedNumber,
	sanitizeCropperState,
	sanitizeRect,
} from './math/sanitize';
import { createCamera, getRotatedBBox, getVisibleBounds } from './camera';

/** Floating-point epsilon for "close enough to equal" comparisons. */
const EPSILON = 1e-9;

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
 * The geometric minimum zoom required for the rotated image to fully cover the
 * crop rectangle. Works in pixel-proportional space where the unrotated image
 * is a×1; the crop rect lives in visual-normalized space and is scaled by the
 * rotation-dependent visual dimensions before projecting into the image-local
 * frame.
 *
 * Returns 0 for a degenerate (zero-area) crop — callers compose the result
 * with their own floor (typically the current zoom or `MIN_ZOOM`).
 *
 * @param rotation         Rotation angle in degrees.
 * @param imageAspectRatio Image width / height ratio.
 * @param cropRect         The crop rectangle in normalized coordinates.
 * @return The minimum zoom factor needed for coverage.
 */
function getMinZoomForCover(
	rotation: number,
	imageAspectRatio: number,
	cropRect: NormalizedRect
): number {
	const aspectRatio = Math.max( imageAspectRatio, Number.EPSILON );
	// The crop rect lives in the SNAP-rotation visual bbox — that's how the
	// stencil and preview position it (see createCamera / getImageFit). Use
	// the snap-rotation dimensions to convert crop fractions to pixels.
	const snapRotation = Math.round( rotation / 90 ) * 90;
	const { visualW: snapVisualW, visualH: snapVisualH } = getVisualDimensions(
		snapRotation,
		aspectRatio
	);
	// Projection into the image-local frame uses the TRUE rotation angle —
	// that's the actual orientation of the image under the stencil.
	const { absC, absS } = getVisualDimensions( rotation, aspectRatio );

	// Crop half-extents in pixel-proportional space.
	const cropHalfW = ( cropRect.width * snapVisualW ) / 2;
	const cropHalfH = ( cropRect.height * snapVisualH ) / 2;

	// AABB of the crop rect projected into the image-local (unrotated) frame.
	const spanAlpha = cropHalfW * absC + cropHalfH * absS;
	const spanBeta = cropHalfW * absS + cropHalfH * absC;

	// Image half-extents at zoom z: (aspectRatio*z/2, z/2).
	// Coverage requires: aspectRatio*z/2 >= spanAlpha  AND  z/2 >= spanBeta.
	const zoomFromAlpha = ( 2 * spanAlpha ) / aspectRatio;
	const zoomFromBeta = 2 * spanBeta;

	return Math.max( zoomFromAlpha, zoomFromBeta );
}

/**
 * Resolves the effective minimum zoom for the current state — the coverage-
 * aware floor when an image is loaded, falling back to `MIN_ZOOM` otherwise.
 * Used by both the cropper's interaction layer and the zoom slider so the
 * floor stays consistent across surfaces.
 *
 * @param state The current cropper state.
 * @return The minimum zoom factor.
 */
export function getMinZoom( state: CropperState ): number {
	if ( ! state.image ) {
		return MIN_ZOOM;
	}
	const imageSize = {
		width: state.image.naturalWidth,
		height: state.image.naturalHeight,
	};
	if ( ! isValidSize( imageSize ) ) {
		return MIN_ZOOM;
	}
	const safeState = sanitizeCropperState( state );
	const aspectRatio = imageSize.width / imageSize.height;
	return Math.max(
		ABSOLUTE_MIN_ZOOM,
		getMinZoomForCover(
			safeState.rotation,
			aspectRatio,
			safeState.cropRect
		)
	);
}

/**
 * Compute the crop handle bounds in normalized visual space — the
 * axis-aligned bounding box (AABB) of the actual image footprint at the
 * current pan/zoom/rotation.
 *
 * Returns the full image AABB without intersecting with the container
 * viewport. The viewport pan mechanism in the Cropper component allows
 * the canvas to scroll so handles can reach the image edge even when it
 * lies outside the visible canvas area.
 *
 * Unlike a static centerline-based calculation, this accounts for the
 * current pan position — if the user pans right, the left bound tightens
 * because the image's left edge has moved right.
 *
 * @param state       The current cropper state (crop, zoom, rotation, flip).
 * @param elementSize The fitted (unrotated) image element dimensions in pixels.
 * @param visualSize  The visual (rotated) image bounding box in pixels.
 * @return The min/max x and y that a crop rect edge can reach in normalized space.
 */
export function getImageCropBounds(
	state: CropperState,
	elementSize: Size,
	visualSize: Size
): { minX: number; minY: number; maxX: number; maxY: number } {
	if ( ! isValidSize( elementSize ) || ! isValidSize( visualSize ) ) {
		return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
	}

	const safeState = sanitizeCropperState( state );

	// Build the same CSS matrix as use-transform-style: flip * rotate * zoom.
	// Flip is outside rotation so it acts in viewport axes (see createCamera).
	const tx = safeState.pan.x * visualSize.width;
	const ty = safeState.pan.y * visualSize.height;
	const rad = degreesToRadians( safeState.rotation );
	const cos = Math.cos( rad );
	const sin = Math.sin( rad );
	const sx = safeState.flip.horizontal ? -1 : 1;
	const sy = safeState.flip.vertical ? -1 : 1;
	const z = safeState.zoom;
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

	return {
		minX: imgMinX,
		minY: imgMinY,
		maxX: imgMaxX,
		maxY: imgMaxY,
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
	// Guard against non-finite inputs. The reducer normalizes these, but
	// programmatic callers or deserialized state could still send NaN/±Infinity
	// through here, where it would silently propagate into the crop rect.
	const safeRect = sanitizeRect( cropRect );
	const zoomCandidate = safeBoundedNumber( zoom, 1 );
	const safeZoom = zoomCandidate >= Number.EPSILON ? zoomCandidate : 1;
	const safeRotation = safeBoundedNumber( rotation, 0 );
	const safeAspect = safeBoundedNumber( imageAspectRatio, 1 );
	const aspectRatio = Math.max( safeAspect, Number.EPSILON );
	// Crop rect lives in the SNAP-rotation visual bbox (matching the stencil
	// layout); projection into the image-local frame uses the TRUE rotation.
	const snapRotation = Math.round( safeRotation / 90 ) * 90;
	const { visualW, visualH } = getVisualDimensions(
		snapRotation,
		aspectRatio
	);
	const { absC, absS } = getVisualDimensions( safeRotation, aspectRatio );
	const W = safeRect.width;
	const H = safeRect.height;

	// Crop full-extents in pixel-proportional space, projected to image-local frame.
	const cropWPx = W * visualW;
	const cropHPx = H * visualH;
	const spanAlpha = cropWPx * absC + cropHPx * absS;
	const spanBeta = cropWPx * absS + cropHPx * absC;

	// Image full-extents at zoom z: (aspectRatio*z, z).
	const limitAlpha = aspectRatio * safeZoom;
	const limitBeta = safeZoom;

	let t = 1;
	if ( spanAlpha > 0 ) {
		t = Math.min( t, limitAlpha / spanAlpha );
	}
	if ( spanBeta > 0 ) {
		t = Math.min( t, limitBeta / spanBeta );
	}
	if ( t >= 1 - EPSILON ) {
		// Crop fits at the current zoom — no size change needed.
		// Return the sanitized rect (not the raw arg) so non-finite fields
		// don't slip through this path. Position is handled by restrictPanZoom.
		return safeRect;
	}
	const newW = W * t;
	const newH = H * t;
	const centerX = safeRect.x + W / 2;
	const centerY = safeRect.y + H / 2;
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

// Pre-allocated scratch buffers for restrictPanZoom's hot path (runs on
// every pointermove) to avoid Float32Array allocation per call.
const _scratchMat = mat2d.create();
const _scratchVec = vec2.create();

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
	const safeState = sanitizeCropperState( state );
	const safeCropRect = sanitizeRect( cropRect );
	// Use `isValidSize` rather than a bare `> 0` check so Infinity dims
	// don't drive `Infinity / Infinity = NaN` into `getMinZoomForCover`
	// and leak as `zoom: NaN` through the no-correction early return.
	const aspectRatio = isValidSize( imageSize )
		? imageSize.width / imageSize.height
		: 1;
	const minZoom = Math.max(
		ABSOLUTE_MIN_ZOOM,
		getMinZoomForCover( safeState.rotation, aspectRatio, safeCropRect )
	);
	const zoom = Math.min( MAX_ZOOM, Math.max( safeState.zoom, minZoom ) );

	// Step 2: build camera with candidate pan and corrected zoom.
	const candidateState = { ...safeState, zoom };
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
	const snapRotation = Math.round( safeState.rotation / 90 ) * 90;
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
			visibleBounds.left + safeCropRect.x * visibleBounds.width,
			visibleBounds.top + safeCropRect.y * visibleBounds.height,
		],
		[
			visibleBounds.left +
				( safeCropRect.x + safeCropRect.width ) * visibleBounds.width,
			visibleBounds.top + safeCropRect.y * visibleBounds.height,
		],
		[
			visibleBounds.left +
				( safeCropRect.x + safeCropRect.width ) * visibleBounds.width,
			visibleBounds.top +
				( safeCropRect.y + safeCropRect.height ) * visibleBounds.height,
		],
		[
			visibleBounds.left + safeCropRect.x * visibleBounds.width,
			visibleBounds.top +
				( safeCropRect.y + safeCropRect.height ) * visibleBounds.height,
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
		return { pan: safeState.pan, zoom };
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
		safeState.pan.x -
		( visibleBounds.width > 0 ? dsx / visibleBounds.width : 0 );
	const newPanY =
		safeState.pan.y -
		( visibleBounds.height > 0 ? dsy / visibleBounds.height : 0 );

	return {
		pan: { x: newPanX, y: newPanY },
		zoom,
	};
}
