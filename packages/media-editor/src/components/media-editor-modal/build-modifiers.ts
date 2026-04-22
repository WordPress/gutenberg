/**
 * Internal dependencies
 */
import type { CropperState, Size } from '../../image-editor';
import { getSourceRegionPercent } from '../../image-editor';

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
 * - `crop`: `left`, `top`, `width`, `height` are percentages `0–100` of the
 *   source image's natural dimensions — NOT pixels. Origin is top-left.
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
	const cropRectPercent = {
		width: state.cropRect.width * 100,
		height: state.cropRect.height * 100,
	};
	if (
		cropRectPercent.width < 100 - CROP_TOLERANCE ||
		cropRectPercent.height < 100 - CROP_TOLERANCE
	) {
		const region = getSourceRegionPercent( state, imageSize );
		modifiers.push( {
			type: 'crop',
			args: {
				left: region.x,
				top: region.y,
				width: region.width,
				height: region.height,
			},
		} );
	}

	return modifiers;
}
