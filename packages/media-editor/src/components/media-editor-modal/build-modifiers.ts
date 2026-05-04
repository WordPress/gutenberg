/**
 * Internal dependencies
 */
import type { CropperState, Size } from '../../image-editor';
import { getRotatedBBox } from '../../image-editor/core/camera';

/**
 * A single modifier in the Core REST `/edit` payload. Order is
 * significant — the server applies modifiers sequentially (see
 * `WP_REST_Attachments_Controller::edit_media_item`).
 *
 * Shape/units:
 *   - `flip`:   booleans per axis. Applied first in this module's output.
 *   - `rotate`: `angle` in degrees, clockwise-positive (matches the
 *     cropper's own convention; Core negates it internally for
 *     `WP_Image_Editor::rotate`, which is counterclockwise-positive).
 *   - `crop`:   percentages (0–100) of the image's dimensions **at the
 *     moment the crop is applied**. Because modifiers are applied in
 *     order, after a preceding `rotate` the server's
 *     `WP_Image_Editor::get_size()` reports the full post-rotate AABB,
 *     so the percentages are of that AABB. Origin is top-left.
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
 * Build a Core-compatible modifiers array from the cropper state.
 *
 * Emits `[flip, rotate, crop]` in that order. Identity operations are
 * pruned — an absent flip, a rotation that normalizes to 0°, and a crop
 * rect that covers (within tolerance) the full post-rotate AABB each
 * produce no modifier. An identity state (fresh image, no edits) returns
 * an empty array; callers can use that to skip the `/edit` call.
 *
 * Frames and math:
 *
 * The cropper's `cropRect` is stored as fractions of the **snap-rotation**
 * bounding box (the stencil-reference frame — see `createCamera` /
 * `createExportCamera`). Pan is in that frame; zoom scales the image
 * beneath a fixed stencil. Two conversions are needed to reach the frame
 * Core's crop modifier applies against:
 *
 *   1. Express the stencil rect in snap-AABB **pixels**:
 *      Image screen-normalized top-left with zoom/pan is
 *      `(0.5 + pan - zoom/2)`; the stencil's pixel footprint is the
 *      inverse of that transform applied to `cropRect`.
 *
 *   2. Translate from snap-AABB coords to full-AABB coords. Both AABBs
 *      share the source-image center, so the conversion is a pure
 *      translation by `(fullCenter - snapCenter)`. Finally, express the
 *      translated rect as percentages of the full AABB.
 *
 * Rotation sign: the cropper composes `flip · R(θ)` on the source (see
 * `createExportCamera` — rotate then flip). Core's `[flip, rotate]`
 * applies the opposite order: `R(θ') · flip`. For both to land on the
 * same pixels we invert the rotation sign when exactly one flip axis
 * is set (`flip_h · R(θ) = R(-θ) · flip_h`). Both-or-neither flips
 * leave the sign alone because `flip_h · flip_v = -I` commutes with
 * rotation.
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

	const { cropRect, pan, zoom, flip } = state;
	const hasFlipH = flip.horizontal;
	const hasFlipV = flip.vertical;

	if ( hasFlipH || hasFlipV ) {
		modifiers.push( {
			type: 'flip',
			args: { flip: { horizontal: hasFlipH, vertical: hasFlipV } },
		} );
	}

	const rawAngle = ( ( state.rotation % 360 ) + 360 ) % 360;
	// Invert the sign for single-axis flips so Core's `flip → rotate`
	// pipeline matches the cropper's `rotate → flip` composition.
	const singleAxisFlip = hasFlipH !== hasFlipV;
	const signedAngle = singleAxisFlip ? ( 360 - rawAngle ) % 360 : rawAngle;
	if ( signedAngle !== 0 ) {
		modifiers.push( { type: 'rotate', args: { angle: signedAngle } } );
	}

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

	// Stencil rect in snap-AABB pixels. Inverts `createExportCamera`'s
	// pan/zoom composition to recover the pixel rectangle the stencil
	// framed in that frame.
	const imgLeft = 0.5 + pan.x - zoom / 2;
	const imgTop = 0.5 + pan.y - zoom / 2;
	const snapX = ( ( cropRect.x - imgLeft ) / zoom ) * snapW;
	const snapY = ( ( cropRect.y - imgTop ) / zoom ) * snapH;
	const widthPx = ( cropRect.width / zoom ) * snapW;
	const heightPx = ( cropRect.height / zoom ) * snapH;

	// Translate to the full AABB (both centered on source).
	const offsetX = ( fullW - snapW ) / 2;
	const offsetY = ( fullH - snapH ) / 2;
	const fullX = snapX + offsetX;
	const fullY = snapY + offsetY;

	// Percentages of the full AABB — Core's crop frame after rotate.
	const leftPct = ( fullX / fullW ) * 100;
	const topPct = ( fullY / fullH ) * 100;
	const widthPct = ( widthPx / fullW ) * 100;
	const heightPct = ( heightPx / fullH ) * 100;

	const coversFullFrame =
		leftPct <= CROP_TOLERANCE &&
		topPct <= CROP_TOLERANCE &&
		widthPct >= 100 - CROP_TOLERANCE &&
		heightPct >= 100 - CROP_TOLERANCE;

	if ( ! coversFullFrame ) {
		modifiers.push( {
			type: 'crop',
			args: {
				left: leftPct,
				top: topPct,
				width: widthPct,
				height: heightPct,
			},
		} );
	}

	return modifiers;
}
