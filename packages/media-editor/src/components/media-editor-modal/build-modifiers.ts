/**
 * Internal dependencies
 */
import type { CropperState, Size } from '../../image-editor';

/**
 * A single modifier in the REST `/edit` payload. Order is significant; the
 * server applies modifiers sequentially in array order.
 *
 * Shape/units (matches `WP_REST_Attachments_Controller::edit_media_item`):
 *
 * - `flip`: booleans for each axis. `horizontal` mirrors left/right,
 *   `vertical` mirrors top/bottom.
 * - `rotate`: `angle` in degrees, clockwise-positive (matches the legacy
 *   `use-save-image.js` convention; the server negates it internally for
 *   `WP_Image_Editor::rotate`, which is counterclockwise-positive).
 * - `crop`: `left`, `top`, `width`, `height` are percentages `0–100` of
 *   the image's dimensions at the point the crop is applied — NOT pixels.
 *   Because the server applies modifiers sequentially, these are percentages
 *   of the post-rotation bounding box (not the original source image).
 *   Origin is top-left.
 */
export type Modifier =
	| {
			type: 'flip';
			args: { flip: { horizontal: boolean; vertical: boolean } };
	  }
	| { type: 'rotate'; args: { angle: number } }
	| {
			type: 'crop';
			args: { left: number; top: number; width: number; height: number };
	  };

/**
 * Tolerance (percent) used to decide whether a crop rect is effectively
 * full-frame. Sub-pixel / float-ulp deltas below this value are treated
 * as no crop. Matches the historical threshold used by the legacy
 * `use-save-image.js` (which compared against `99.9`).
 */
const CROP_TOLERANCE = 0.1;

/**
 * Converts the current cropper state into a REST `/edit` modifiers array.
 *
 * Modifier order is `[flip, rotate, crop]` to match the cropper's visual
 * composition (flip source → rotate → select crop rect) and the server's
 * sequential `foreach` apply.
 *
 * Identity operations (no flip, rotation of 0/360, full-frame crop) are
 * dropped so the output is the minimum set the server needs. A zero-size
 * image yields an empty array.
 *
 * @param state     Current cropper state.
 * @param imageSize Natural dimensions of the source image.
 * @return Ordered modifier array; empty when nothing is server-relevant.
 */
export function buildModifiers(
	state: CropperState,
	imageSize: Size
): Modifier[] {
	const modifiers: Modifier[] = [];

	if ( imageSize.width === 0 || imageSize.height === 0 ) {
		return modifiers;
	}

	if ( state.flip.horizontal || state.flip.vertical ) {
		modifiers.push( {
			type: 'flip',
			args: { flip: { ...state.flip } },
		} );
	}

	const angle = ( ( state.rotation % 360 ) + 360 ) % 360;
	if ( angle !== 0 ) {
		modifiers.push( { type: 'rotate', args: { angle } } );
	}

	// Detect "no user crop" from the normalized cropRect itself rather than
	// from the source-region percentages. When the image is rotated, the
	// default full-frame cropRect already maps to a region whose width and
	// height in source-image percent space fall outside [0, 100] (because
	// the rotated bounding box differs from the source), so using the
	// region values here would spuriously emit crops for rotate-only
	// states. The cropRect is where the user's intent lives: at defaults
	// (0, 0, 1, 1) there is no crop to apply.
	if (
		state.cropRect.width * 100 < 100 - CROP_TOLERANCE ||
		state.cropRect.height * 100 < 100 - CROP_TOLERANCE
	) {
		// The REST `/edit` endpoint applies modifiers sequentially. By the
		// time `crop` is processed, the image has already been rotated, so
		// `WP_Image_Editor::get_size()` reports the post-rotation bounding
		// box. Crop args are percentages of THAT frame, not of the
		// original source image.
		//
		// `cropRect` is expressed in the snap-rotation bbox's normalized
		// [0, 1] space (matches `createExportCamera` / `renderToCanvas`),
		// so when `zoom === 1` and `pan` is at the origin the cropRect
		// maps directly to percentages of the post-rotation canvas.
		//
		// Under zoom/pan the stencil still frames the same region of the
		// post-rotation canvas, but the pixels beneath come from a
		// zoomed-in slice of the source. The server can't reproduce the
		// zoom (crop alone cannot upscale), so we emit the equivalent
		// smaller crop: same source content, smaller pixel output. This
		// matches the source region the user saw through the stencil —
		// see `getSourceRegion` in `image-editor/core/source-region.ts`,
		// which derives the same frame in source-image units.
		const zoom = state.zoom;
		const width = ( state.cropRect.width * 100 ) / zoom;
		const height = ( state.cropRect.height * 100 ) / zoom;
		// At zoom > 1 the image is scaled up around its center and
		// shifted by pan (in rotation-bbox units). The cropRect's
		// top-left, mapped to the unrotated image's normalized coords,
		// is the offset below — see the derivation in the task notes.
		const left =
			( ( state.cropRect.x + zoom / 2 - 0.5 - state.pan.x ) * 100 ) /
			zoom;
		const top =
			( ( state.cropRect.y + zoom / 2 - 0.5 - state.pan.y ) * 100 ) /
			zoom;
		modifiers.push( {
			type: 'crop',
			args: { left, top, width, height },
		} );
	}

	return modifiers;
}
