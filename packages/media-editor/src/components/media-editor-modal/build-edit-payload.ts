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
 *   2. `crop` — an axis-aligned rectangle in the **post-transform canvas**.
 *      Pixel units match that canvas. No mixed frames, no rotation math
 *      on the rect.
 *
 * Caveat for fine rotation: the cropper's stencil is laid out against the
 * snap-rotation bbox (stable through ±45° fine rotation), so `crop` is
 * expressed in that canvas. At snap angles (multiples of 90°) this equals
 * the full post-transform canvas and the result is pixel-exact WYSIWYG.
 * At non-snap angles the server rotates to the full AABB and crops the
 * same-dimension rect; the content is visually close to the stencil but
 * not pixel-identical. MVP scope.
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
 * The cropper's `cropRect` is stored as fractions of the snap-rotation
 * bounding box (the stencil-reference frame — see `createCamera` /
 * `createExportCamera`). Pan is also in that frame, and zoom scales the
 * image under a fixed stencil.
 *
 * Converting to post-transform canvas pixels is a pure bookkeeping step:
 *
 *   - The post-transform canvas is the snap-rotation bbox of the source
 *     (e.g. 1024×576 source at 90° → 576×1024 canvas).
 *   - At zoom 1, pan 0, the image fills the canvas. The stencil then
 *     samples `[cropRect.x * rotW .. +cropRect.width * rotW]` directly.
 *   - With zoom z, pan p, the image is scaled about the canvas center
 *     and offset by pan. The stencil's footprint in canvas pixels is the
 *     inverse of that transform applied to the stencil rect.
 *
 * Fine rotation (non-multiple of 90°) is represented purely in `transform`.
 * The crop rect stays in the snap-rotation canvas because that's the frame
 * the user framed their crop in; the server composes snap + fine into a
 * single rotate call before cropping.
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
	const { width: rotW, height: rotH } = getRotatedBBox(
		imageSize.width,
		imageSize.height,
		snapRotation
	);

	const { cropRect, pan, zoom } = state;

	// Image's screen-normalized top-left with zoom/pan applied. The image
	// is centered on (0.5 + pan) and scaled by `zoom` about that center,
	// so its top-left sits at (0.5 + pan - zoom/2).
	const imgLeft = 0.5 + pan.x - zoom / 2;
	const imgTop = 0.5 + pan.y - zoom / 2;

	const x = ( ( cropRect.x - imgLeft ) / zoom ) * rotW;
	const y = ( ( cropRect.y - imgTop ) / zoom ) * rotH;
	const width = ( cropRect.width / zoom ) * rotW;
	const height = ( cropRect.height / zoom ) * rotH;

	return {
		transform: {
			rotation: state.rotation,
			flip: { ...state.flip },
		},
		crop: { x, y, width, height },
	};
}
