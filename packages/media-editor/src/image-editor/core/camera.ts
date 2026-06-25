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
import {
	isSafeNumber,
	isValidSize,
	safeBoundedNumber,
	sanitizeCropperState,
} from './math/sanitize';

// Pre-allocated scratch buffers for `screenToWorld`, which is called per
// pointermove. Module-level singletons — safe because usage is synchronous.
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
	// Short-circuit on any unsafe input. `isSafeNumber` is stricter than
	// `Number.isFinite`: very large but technically-finite rotations (e.g.
	// `Number.MAX_VALUE`) overflow inside `degreesToRadians` and then
	// `Math.cos`/`Math.sin` return `NaN`, so the magnitude bound matters.
	if (
		! isSafeNumber( width ) ||
		! isSafeNumber( height ) ||
		! isSafeNumber( rotation ) ||
		width <= 0 ||
		height <= 0
	) {
		return { width: 0, height: 0 };
	}
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
	if ( ! isValidSize( containerSize ) || ! isValidSize( imageSize ) ) {
		return {
			elementSize: { width: 0, height: 0 },
			visualSize: { width: 0, height: 0 },
		};
	}
	const safeRotation = safeBoundedNumber( rotation, 0 );
	// Snap rotation to the nearest 90° multiple for layout sizing.
	// This keeps the stencil a stable size through fine ±45° rotation
	// (no inflation at 15°/30° etc.) while still swapping aspect at
	// 90°/180°/270° so the snap rotate preserves the framed content.
	const snapRotation = Math.round( safeRotation / 90 ) * 90;
	const naturalBBox = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);
	// Defensive: getRotatedBBox returns zero dims for hostile inputs, which
	// would make fitScale infinite. Mirror the zero-container short-circuit.
	if ( naturalBBox.width === 0 || naturalBBox.height === 0 ) {
		return {
			elementSize: { width: 0, height: 0 },
			visualSize: { width: 0, height: 0 },
		};
	}
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
 * Resolve the presentational view magnification that makes the crop fill the
 * canvas.
 *
 * The crop overlay is laid out as `cropRect * visualSize` (the contain-fit
 * footprint, with no zoom), so its on-screen size is capped by that footprint.
 * When a crop's aspect differs from the image's, it can be much smaller than
 * the canvas could show (e.g. a square crop in a tall image is bound by the
 * footprint's narrow axis). Scaling `elementSize` and `visualSize` together by
 * the returned factor uniformly magnifies the whole scene — image, crop
 * overlay, and overlays — so the crop reaches `targetFill` of its constraining
 * canvas axis, with the image bleeding past the canvas (clipped by the host).
 *
 * Purely presentational: it does not touch `zoom`/`pan`/`cropRect`/`rotation`,
 * so the framed source region — and therefore the export — is unchanged.
 *
 * @param cropRect   The crop rectangle, normalized to the footprint.
 * @param canvasSize The canvas size in pixels.
 * @param visualSize The contain-fit (rotated) image footprint in pixels.
 * @param targetFill Fraction of the constraining canvas axis to fill (0–1].
 * @param maxScale   Upper bound on the magnification.
 * @return A magnification factor in [1, maxScale]; 1 when none is needed.
 */
export function getViewScale(
	cropRect: NormalizedRect,
	canvasSize: Size,
	visualSize: Size,
	targetFill: number,
	maxScale: number
): number {
	const cropScreenW = cropRect.width * visualSize.width;
	const cropScreenH = cropRect.height * visualSize.height;
	// `> 0` comparisons (rather than `<= 0`) reject NaN as well as zero and
	// negatives, so a non-finite rect/dimension/scale can't propagate to a
	// `scale(NaN)`. `isValidSize` already guards finiteness of the sizes.
	if (
		! isValidSize( canvasSize ) ||
		! isValidSize( visualSize ) ||
		! ( cropScreenW > 0 ) ||
		! ( cropScreenH > 0 ) ||
		! Number.isFinite( targetFill ) ||
		! Number.isFinite( maxScale ) ||
		! ( targetFill > 0 ) ||
		! ( maxScale >= 1 )
	) {
		return 1;
	}
	const kW = ( targetFill * canvasSize.width ) / cropScreenW;
	const kH = ( targetFill * canvasSize.height ) / cropScreenH;
	const k = Math.min( kW, kH );
	return Math.min( maxScale, Math.max( 1, k ) );
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

	if ( ! isValidSize( containerSize ) || ! isValidSize( imageSize ) ) {
		return m;
	}

	const safeState = sanitizeCropperState( state );

	// Use the nearest 90° multiple for layout sizing so the stencil
	// and visual bounds are stable through fine rotation. The actual
	// `state.rotation` is still used for the rotation component of
	// the matrix below.
	const snapRotation = Math.round( safeState.rotation / 90 ) * 90;

	// Rotated bounding box of the natural image (at snap angle).
	const naturalBBox = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);

	// Defensive: getRotatedBBox returns zero dims for unsafe inputs. Mirror
	// the zero-size short-circuit so `fitScale` doesn't become Infinity.
	if ( naturalBBox.width === 0 || naturalBBox.height === 0 ) {
		return m;
	}

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
	mat2d.translate( m, m, [
		safeState.pan.x * visualW,
		safeState.pan.y * visualH,
	] );

	// Flip (viewport-relative — composed outside rotation so horizontal
	// flip always mirrors across the viewport's vertical axis).
	mat2d.scale( m, m, [
		safeState.flip.horizontal ? -1 : 1,
		safeState.flip.vertical ? -1 : 1,
	] );

	// Rotate.
	mat2d.rotate( m, m, degreesToRadians( safeState.rotation ) );

	// Zoom.
	mat2d.scale( m, m, [ safeState.zoom, safeState.zoom ] );

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
 * Compose a camera matrix for exporting to a canvas.
 *
 * The resulting matrix maps image-pixel coordinates directly to output-canvas
 * coordinates. Apply it with `ctx.setTransform( ...camera )` then
 * `ctx.drawImage( image, 0, 0 )`.
 *
 * The transform chain mirrors the `renderToCanvas` function in canvas-renderer.ts:
 *   translate(visualCenter - cropOffset + outCenter) → flip → rotate → zoom → translate(-imgCenter)
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
	if ( ! isValidSize( imageSize ) || ! isValidSize( outputSize ) ) {
		return m;
	}
	const { rotation, flip, cropRect, zoom, pan } =
		sanitizeCropperState( state );
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
