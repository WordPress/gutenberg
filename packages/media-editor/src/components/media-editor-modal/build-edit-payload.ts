/**
 * Internal dependencies
 */
import type { CropperState, Size } from '../../image-editor';
import { getRotatedBBox } from '../../image-editor/core/camera';

/**
 * Canonical edit payload for the experimental `/wp/v2/media/{id}/edit`
 * handler in `lib/experimental/source-region-edit.php`.
 *
 * Describes "the image the user sees" as two independent parts:
 *
 *   1. `transform` — source-pixel operations applied in order:
 *      rotate by `rotation` degrees, then flip horizontally / vertically.
 *      The server applies the same operations to produce the same canvas.
 *
 *   2. `crop` — an axis-aligned rectangle in the **post-transform canvas**
 *      (the full-rotation AABB of the source). Pixel units match that
 *      canvas. No mixed frames.
 *
 * Fine rotation (non-multiple of 90°) is the straighten-then-crop case:
 * the output is the fully-rotated image with an axis-aligned slice taken
 * around the stencil center. The slice dimensions match the stencil; the
 * slice's content is a clean rectangle of straightened image, which is
 * what the "straighten a tilted photo and crop" workflow wants.
 */
export interface EditPayload {
	transform: {
		rotation: number;
		flip: { horizontal: boolean; vertical: boolean };
	};
	crop: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
}

/**
 * Build the canonical edit payload from the cropper state.
 *
 * The cropper's `cropRect` is stored as fractions of the **snap-rotation**
 * bounding box (the stencil-reference frame — see `createCamera` /
 * `createExportCamera`). Pan is in that frame; zoom scales the image
 * under a fixed stencil.
 *
 * Two conversions:
 *
 *   1. Express the stencil rect in snap-AABB pixels:
 *      Image screen-normalized top-left with zoom/pan is
 *      `(0.5 + pan - zoom/2)`; the stencil's pixel footprint is the
 *      inverse of that transform applied to `cropRect`.
 *
 *   2. Translate from snap-AABB coords to full-AABB coords. Both AABBs
 *      share the source-image center, so the conversion is a pure
 *      translation by `(fullCenter - snapCenter)`. No rotation: the
 *      server's `rotate(state.rotation)` on the source already produces
 *      the full-AABB canvas in its natural orientation, so the crop
 *      rect just needs to slide to the full AABB's origin.
 *
 * The resulting `crop` is axis-aligned in the full post-rotate AABB, so
 * the server can apply it directly with `WP_Image_Editor::crop` after
 * rotating the source by `transform.rotation`.
 *
 * @param state     Current cropper state.
 * @param imageSize Natural dimensions of the source image.
 * @return Payload ready to post to the `/edit` endpoint.
 */
export function buildEditPayload(
	state: CropperState,
	imageSize: Size
): EditPayload {
	const snapRotation = Math.round( state.rotation / 90 ) * 90;
	const { width: snapW, height: snapH } = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);
	const { width: fullW, height: fullH } = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		state.rotation
	);

	const { cropRect, pan, zoom } = state;

	// Stencil rect in snap-AABB pixels.
	const imgLeft = 0.5 + pan.x - zoom / 2;
	const imgTop = 0.5 + pan.y - zoom / 2;
	const snapX = ( ( cropRect.x - imgLeft ) / zoom ) * snapW;
	const snapY = ( ( cropRect.y - imgTop ) / zoom ) * snapH;
	const width = ( cropRect.width / zoom ) * snapW;
	const height = ( cropRect.height / zoom ) * snapH;

	// Pure translation from snap-AABB to full-AABB (both share source
	// center; only their AABB extents differ).
	const offsetX = ( fullW - snapW ) / 2;
	const offsetY = ( fullH - snapH ) / 2;

	return {
		transform: {
			rotation: state.rotation,
			flip: { ...state.flip },
		},
		crop: {
			x: snapX + offsetX,
			y: snapY + offsetY,
			width,
			height,
		},
	};
}
