/**
 * Internal dependencies
 */
import type { CropperState, NormalizedRect, Size } from '../image-editor';
import { getRotatedBBox } from '../image-editor/core/camera';

/**
 * The crop rectangle expressed as pixel dimensions in the snap-rotation
 * bounding-box frame. This is the frame the stencil lives in — the same
 * one `buildModifiers` uses to construct the server crop payload.
 *
 * For 0° (and 180°) rotation the snap-AABB equals the source image, so
 * these values are source pixels. For 90°/270° the axes swap. For
 * non-snap rotations (e.g. 45°) the snap-AABB is the nearest 90° AABB,
 * which is how the stencil is positioned.
 */
export interface CropPixels {
	/** X offset of the crop in the snap-rotation bounding box, in pixels. */
	x: number;
	/** Y offset of the crop in the snap-rotation bounding box, in pixels. */
	y: number;
	/** Width of the crop, in pixels. */
	width: number;
	/** Height of the crop, in pixels. */
	height: number;
	/** Width of the snap-rotation bounding box, in pixels. */
	snapBBoxWidth: number;
	/** Height of the snap-rotation bounding box, in pixels. */
	snapBBoxHeight: number;
}

/**
 * Convert the cropper's normalized cropRect to pixel dimensions in the
 * snap-rotation bounding-box frame.
 *
 * This is the shared math used by `buildModifiers` (to construct the server
 * crop payload) and by the Advanced crop panel (to display and accept
 * pixel-value input). Both callers must stay in sync: if the conversion
 * changes, the server payload and the UI inputs change together.
 *
 * @param state     The current cropper state.
 * @param imageSize Natural dimensions of the source image.
 * @return Pixel dimensions of the crop in the snap-rotation frame.
 */
export function getCropPixels(
	state: CropperState,
	imageSize: Size
): CropPixels {
	const { cropRect, pan, zoom, rotation } = state;
	const snapRotation = Math.round( rotation / 90 ) * 90;
	const { width: snapBBoxWidth, height: snapBBoxHeight } = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);
	const imgLeft = 0.5 + pan.x - zoom / 2;
	const imgTop = 0.5 + pan.y - zoom / 2;

	return {
		x: ( ( cropRect.x - imgLeft ) / zoom ) * snapBBoxWidth,
		y: ( ( cropRect.y - imgTop ) / zoom ) * snapBBoxHeight,
		width: ( cropRect.width / zoom ) * snapBBoxWidth,
		height: ( cropRect.height / zoom ) * snapBBoxHeight,
		snapBBoxWidth,
		snapBBoxHeight,
	};
}

/**
 * Convert pixel dimensions in the snap-rotation bounding-box frame back to
 * a normalized `NormalizedRect`. Exact inverse of `getCropPixels`.
 *
 * @param pixels        Crop position and size in snap-rotation pixels.
 * @param pixels.x      X offset of the crop.
 * @param pixels.y      Y offset of the crop.
 * @param pixels.width  Width of the crop.
 * @param pixels.height Height of the crop.
 * @param state         The current cropper state (provides zoom, pan, rotation).
 * @param imageSize     Natural dimensions of the source image.
 * @return The normalized crop rectangle.
 */
export function pixelsToCropRect(
	pixels: { x: number; y: number; width: number; height: number },
	state: CropperState,
	imageSize: Size
): NormalizedRect {
	const { pan, zoom, rotation } = state;
	const snapRotation = Math.round( rotation / 90 ) * 90;
	const { width: snapBBoxWidth, height: snapBBoxHeight } = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);
	const imgLeft = 0.5 + pan.x - zoom / 2;
	const imgTop = 0.5 + pan.y - zoom / 2;

	return {
		x: ( pixels.x / snapBBoxWidth ) * zoom + imgLeft,
		y: ( pixels.y / snapBBoxHeight ) * zoom + imgTop,
		width: ( pixels.width / snapBBoxWidth ) * zoom,
		height: ( pixels.height / snapBBoxHeight ) * zoom,
	};
}
