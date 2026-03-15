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

/**
 * Compose a camera matrix from cropper state, container, and image dimensions.
 *
 * The matrix maps normalized world coordinates [0,1] x [0,1] to screen pixels.
 * Input (0,0) = image top-left, (1,1) = image bottom-right.
 *
 * Composition order (left-to-right = outermost first, applied last to point):
 *   M = T_containerCenter * T_pan * R_rotation * S_flip * S_zoom * T_center * S_toRenderedPixels
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

	const rad = degreesToRadians( state.rotation );
	const cosR = Math.abs( Math.cos( rad ) );
	const sinR = Math.abs( Math.sin( rad ) );

	// Rotated bounding box of the natural image.
	const rotW = cosR * imageSize.width + sinR * imageSize.height;
	const rotH = sinR * imageSize.width + cosR * imageSize.height;

	// "Contain" fit: scale rotated bounding box to fit within container.
	const fitScale = Math.min(
		containerSize.width / rotW,
		containerSize.height / rotH
	);

	// The rendered (unrotated) image dimensions at this fit scale.
	const renderedW = imageSize.width * fitScale;
	const renderedH = imageSize.height * fitScale;

	// Visual (rotated) image footprint in pixels.
	const visualW = cosR * renderedW + sinR * renderedH;
	const visualH = sinR * renderedW + cosR * renderedH;

	// Build matrix left-to-right (outermost first).
	// Innermost operations (last in code) are applied first to input point.

	// Outermost: translate to container center.
	mat2d.translate( m, m, [
		containerSize.width / 2,
		containerSize.height / 2,
	] );

	// Pan offset in visual-space pixels.
	mat2d.translate( m, m, [ state.crop.x * visualW, state.crop.y * visualH ] );

	// Rotate.
	mat2d.rotate( m, m, degreesToRadians( state.rotation ) );

	// Flip (negative scale).
	mat2d.scale( m, m, [
		state.flip.horizontal ? -1 : 1,
		state.flip.vertical ? -1 : 1,
	] );

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
	const inv = mat2d.create();
	mat2d.invert( inv, camera );
	const out = vec2.create();
	vec2.transformMat2d( out, [ point.x, point.y ], inv );
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
 * Returns the axis-aligned bounding box of the full image (normalized [0,1]x[0,1])
 * after applying the camera transform.
 *
 * @param camera The camera matrix from createCamera.
 * @return The screen-space bounding box of the full image.
 */
export function getVisibleBounds( camera: Camera ): VisualBounds {
	const corners = [
		[ 0, 0 ],
		[ 1, 0 ],
		[ 1, 1 ],
		[ 0, 1 ],
	];
	const screenCorners = corners.map( ( c ) => {
		const out = vec2.create();
		vec2.transformMat2d( out, c as [ number, number ], camera );
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
 * Returns the axis-aligned bounding box of a crop rectangle in screen (pixel) space.
 *
 * @param camera   The camera matrix from createCamera.
 * @param cropRect The crop rectangle in normalized coordinates.
 * @return The screen-space bounding box of the crop rectangle.
 */
export function cropRectToScreenBounds(
	camera: Camera,
	cropRect: NormalizedRect
): VisualBounds {
	const { x, y, width, height } = cropRect;
	const corners = [
		[ x, y ],
		[ x + width, y ],
		[ x + width, y + height ],
		[ x, y + height ],
	];
	const screenCorners = corners.map( ( c ) => {
		const out = vec2.create();
		vec2.transformMat2d( out, c as [ number, number ], camera );
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
 * Alias for cropRectToScreenBounds — transforms a normalized rect to screen bounds.
 *
 * @param camera The camera matrix from createCamera.
 * @param rect   The rectangle in normalized coordinates.
 * @return The screen-space bounding box of the rectangle.
 */
export function worldToScreenRect(
	camera: Camera,
	rect: NormalizedRect
): VisualBounds {
	return cropRectToScreenBounds( camera, rect );
}

/**
 * Clamps a value to the normalized [0, 1] range.
 *
 * @param value The value to clamp.
 * @return The clamped value.
 */
export function clampNormalized( value: number ): number {
	return Math.min( 1, Math.max( 0, value ) );
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
	return {
		visualW: absC * imageAspectRatio + absS,
		visualH: absS * imageAspectRatio + absC,
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
export function getMinZoomForCover(
	rotation: number,
	imageAspectRatio: number,
	cropRect: NormalizedRect
): number {
	const a = Math.max( imageAspectRatio, Number.EPSILON );
	const { visualW, visualH, absC, absS } = getVisualDimensions( rotation, a );

	// Crop half-extents in pixel-proportional space.
	const cropHalfW = ( cropRect.width * visualW ) / 2;
	const cropHalfH = ( cropRect.height * visualH ) / 2;

	// AABB of the crop rect projected into the image-local (unrotated) frame.
	const spanAlpha = cropHalfW * absC + cropHalfH * absS;
	const spanBeta = cropHalfW * absS + cropHalfH * absC;

	// Image half-extents at zoom z: (a*z/2, z/2).
	// Coverage requires: a*z/2 >= spanAlpha  AND  z/2 >= spanBeta.
	const zoomFromAlpha = ( 2 * spanAlpha ) / a;
	const zoomFromBeta = 2 * spanBeta;

	return Math.max( 1, zoomFromAlpha, zoomFromBeta );
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
	const a = Math.max( imageAspectRatio, Number.EPSILON );
	const { visualW, visualH, absC, absS } = getVisualDimensions( rotation, a );
	const W = cropRect.width;
	const H = cropRect.height;

	// Crop full-extents in pixel-proportional space, projected to image-local frame.
	const cropWPx = W * visualW;
	const cropHPx = H * visualH;
	const spanAlpha = cropWPx * absC + cropHPx * absS;
	const spanBeta = cropWPx * absS + cropHPx * absC;

	// Image full-extents at zoom z: (a*z, z).
	const limitAlpha = a * zoom;
	const limitBeta = zoom;

	let t = 1;
	if ( spanAlpha > 0 ) {
		t = Math.min( t, limitAlpha / spanAlpha );
	}
	if ( spanBeta > 0 ) {
		t = Math.min( t, limitBeta / spanBeta );
	}
	if ( t >= 1 - 1e-9 ) {
		const x = Math.max( 0, Math.min( cropRect.x, 1 - W ) );
		const y = Math.max( 0, Math.min( cropRect.y, 1 - H ) );
		if ( x === cropRect.x && y === cropRect.y ) {
			return cropRect;
		}
		return { x, y, width: W, height: H };
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
 * Clamps pan and adjusts zoom so that the zoomed, rotated image fully covers
 * the crop rectangle.
 *
 * Works in pixel-proportional space where the unrotated image is a×1.
 * All visual-normalized coordinates are multiplied by the rotation-dependent
 * visual dimensions before being rotated into the image-local frame, ensuring
 * the rotation is physically correct regardless of image aspect ratio.
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
): { crop: { x: number; y: number }; zoom: number } {
	const a =
		imageSize.width > 0 && imageSize.height > 0
			? imageSize.width / imageSize.height
			: 1;
	const minZoom = getMinZoomForCover( state.rotation, a, cropRect );
	const zoom = Math.max( state.zoom, minZoom );

	const rad = degreesToRadians( state.rotation );
	const C = Math.cos( rad );
	const S = Math.sin( rad );
	const { visualW, visualH, absC, absS } = getVisualDimensions(
		state.rotation,
		a
	);

	// Image half-extents in image-local frame at current zoom.
	// Unrotated image is a×1, so at zoom z: (a*z/2, z/2).
	const imgHalfW = ( a * zoom ) / 2;
	const imgHalfH = zoom / 2;

	// Crop rect center offset from visual center, in pixel-proportional units.
	const cropCx = ( cropRect.x + cropRect.width / 2 - 0.5 ) * visualW;
	const cropCy = ( cropRect.y + cropRect.height / 2 - 0.5 ) * visualH;

	// Crop rect half-extents in pixel-proportional units.
	const cropHalfW = ( cropRect.width * visualW ) / 2;
	const cropHalfH = ( cropRect.height * visualH ) / 2;

	// Pan in pixel-proportional units.
	const panX = state.crop.x * visualW;
	const panY = state.crop.y * visualH;

	// Rotate crop center and pan into image-local (unrotated) frame.
	const cropAlpha = cropCx * C + cropCy * S;
	const cropBeta = -cropCx * S + cropCy * C;
	let panAlpha = panX * C + panY * S;
	let panBeta = -panX * S + panY * C;

	// Crop half-span in image-local frame (AABB of the rotated crop rect).
	const cropSpanAlpha = cropHalfW * absC + cropHalfH * absS;
	const cropSpanBeta = cropHalfW * absS + cropHalfH * absC;

	// Maximum pan offset in image-local frame.
	const alphaMax = Math.max( 0, imgHalfW - cropSpanAlpha );
	const betaMax = Math.max( 0, imgHalfH - cropSpanBeta );

	// Clamp pan to allowed range (centered on crop center).
	panAlpha = Math.min(
		cropAlpha + alphaMax,
		Math.max( cropAlpha - alphaMax, panAlpha )
	);
	panBeta = Math.min(
		cropBeta + betaMax,
		Math.max( cropBeta - betaMax, panBeta )
	);

	// Rotate back to visual frame.
	const newPanX = panAlpha * C - panBeta * S;
	const newPanY = panAlpha * S + panBeta * C;

	// Convert back to visual-normalized coordinates.
	return {
		crop: {
			x: visualW > 0 ? newPanX / visualW : 0,
			y: visualH > 0 ? newPanY / visualH : 0,
		},
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
	const { rotation, flip, cropRect, zoom, crop } = state;
	if (
		imageSize.width === 0 ||
		imageSize.height === 0 ||
		outputSize.width === 0 ||
		outputSize.height === 0
	) {
		return m;
	}
	const rad = degreesToRadians( rotation );
	const cosR = Math.abs( Math.cos( rad ) );
	const sinR = Math.abs( Math.sin( rad ) );
	const rotW = cosR * imageSize.width + sinR * imageSize.height;
	const rotH = sinR * imageSize.width + cosR * imageSize.height;

	// Scale factor to map the natural crop region to the output canvas size.
	const naturalCropW = cropRect.width * rotW;
	const naturalCropH = cropRect.height * rotH;
	const outputScaleX = naturalCropW > 0 ? outputSize.width / naturalCropW : 1;
	const outputScaleY =
		naturalCropH > 0 ? outputSize.height / naturalCropH : 1;

	const cropOffsetX = cropRect.x * rotW + outputSize.width / 2 / outputScaleX;
	const cropOffsetY =
		cropRect.y * rotH + outputSize.height / 2 / outputScaleY;
	const visualCenterX = rotW / 2 + crop.x * rotW;
	const visualCenterY = rotH / 2 + crop.y * rotH;
	mat2d.scale( m, m, [ outputScaleX, outputScaleY ] );
	mat2d.translate( m, m, [
		visualCenterX - cropOffsetX + outputSize.width / 2 / outputScaleX,
		visualCenterY - cropOffsetY + outputSize.height / 2 / outputScaleY,
	] );
	mat2d.rotate( m, m, degreesToRadians( rotation ) );
	mat2d.scale( m, m, [
		zoom * ( flip.horizontal ? -1 : 1 ),
		zoom * ( flip.vertical ? -1 : 1 ),
	] );
	mat2d.translate( m, m, [ -imageSize.width / 2, -imageSize.height / 2 ] );
	return m;
}
