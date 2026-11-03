import type { CropperState } from './core/types';
import { getRotatedBBox } from './core/camera';

/**
 * One step that makes the original image match what the person framed.
 * Apply the steps in order, to the full-size original.
 *
 *   - `flip`:   mirror along each axis that is `true`.
 *   - `rotate`: rotate clockwise by `angle` degrees, about the centre. The
 *     result is the bounding box of the rotated image.
 *   - `crop`:   cut out a rectangle of the image as it is **at that
 *     point**, after any `rotate` before it. Position and size are
 *     fractions (0–1) of that image's width and height, from the top-left.
 */
export type OriginalImageStep =
	| { type: 'flip'; horizontal: boolean; vertical: boolean }
	| { type: 'rotate'; angle: number }
	| { type: 'crop'; x: number; y: number; width: number; height: number };

/**
 * Tolerance (a fraction of the image) used to decide whether a crop rect
 * is effectively full-frame. Sub-pixel / float-ulp deltas below this
 * value are treated as no crop. Matches the historical threshold used by
 * the legacy `use-save-image.js` (which compared against `99.9` percent).
 */
const CROP_TOLERANCE = 0.001;

/**
 * The steps that make the original image match what the person framed,
 * for saving the edit: send them to a server, or run them with an image
 * library in the browser.
 *
 * Emits `[flip, rotate, crop]` in that order. Identity operations are
 * pruned — an absent flip, a rotation that normalizes to 0°, and a crop
 * rect that covers (within tolerance) the full post-rotate AABB each
 * produce no step. An identity state (fresh image, no edits) returns
 * an empty array; callers can use that to skip saving.
 *
 * Frames and math:
 *
 * The cropper's `cropRect` is stored as fractions of the **snap-rotation**
 * bounding box (the stencil-reference frame — see `createCamera` /
 * `createExportCamera`). Pan is in that frame; zoom scales the image
 * beneath a fixed stencil. Two conversions are needed to reach the frame
 * the crop step applies against:
 *
 *   1. Express the stencil rect in snap-AABB **pixels**:
 *      Image screen-normalized top-left with zoom/pan is
 *      `(0.5 + pan - zoom/2)`; the stencil's pixel footprint is the
 *      inverse of that transform applied to `cropRect`.
 *
 *   2. Translate from snap-AABB coords to full-AABB coords. Both AABBs
 *      share the source-image center, so the conversion is a pure
 *      translation by `(fullCenter - snapCenter)`. Finally, express the
 *      translated rect as fractions of the full AABB.
 *
 * Rotation sign: the cropper composes `flip · R(θ)` on the source (see
 * `createExportCamera` — rotate then flip). The steps' `[flip, rotate]`
 * order is the opposite: `R(θ') · flip`. For both to land on the
 * same pixels we invert the rotation sign when exactly one flip axis
 * is set (`flip_h · R(θ) = R(-θ) · flip_h`). Both-or-neither flips
 * leave the sign alone because `flip_h · flip_v = -I` commutes with
 * rotation.
 *
 * @param state The editor state. The edit and the loaded image's natural
 *              size are both read from it.
 * @return Ordered steps; empty when nothing changes the original or no
 *         image has loaded.
 */
export function getStepsForOriginal(
	state: Pick<
		CropperState,
		'image' | 'pan' | 'zoom' | 'rotation' | 'flip' | 'cropRect'
	>
): OriginalImageStep[] {
	const steps: OriginalImageStep[] = [];
	const { image } = state;

	if ( ! image || image.naturalWidth === 0 || image.naturalHeight === 0 ) {
		return steps;
	}

	const imageSize = {
		width: image.naturalWidth,
		height: image.naturalHeight,
	};
	const { cropRect, pan, zoom, flip } = state;
	const hasFlipH = flip.horizontal;
	const hasFlipV = flip.vertical;

	if ( hasFlipH || hasFlipV ) {
		steps.push( {
			type: 'flip',
			horizontal: hasFlipH,
			vertical: hasFlipV,
		} );
	}

	const rawAngle = ( ( state.rotation % 360 ) + 360 ) % 360;
	// Invert the sign for single-axis flips so the steps' `flip → rotate`
	// order matches the cropper's `rotate → flip` composition.
	const singleAxisFlip = hasFlipH !== hasFlipV;
	const signedAngle = singleAxisFlip ? ( 360 - rawAngle ) % 360 : rawAngle;
	if ( signedAngle !== 0 ) {
		steps.push( { type: 'rotate', angle: signedAngle } );
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

	// Fractions of the full AABB — the crop frame after rotate.
	const x = fullX / fullW;
	const y = fullY / fullH;
	const width = widthPx / fullW;
	const height = heightPx / fullH;

	const coversFullFrame =
		x <= CROP_TOLERANCE &&
		y <= CROP_TOLERANCE &&
		width >= 1 - CROP_TOLERANCE &&
		height >= 1 - CROP_TOLERANCE;

	if ( ! coversFullFrame ) {
		steps.push( { type: 'crop', x, y, width, height } );
	}

	return steps;
}
