import type { Flip, ImageEditorState, NormalizedRect } from './core/types';
import { getRotatedBBox } from './core/camera';

/**
 * How the image loaded in `state.image` is edited: the flip, rotation and
 * crop that turn it into what the person framed. Apply them in that order.
 * A part is absent when it changes nothing.
 */
export interface ImageEdit {
	flip?: Flip;
	/**
	 * Degrees clockwise about the centre, applied after the flip. With
	 * exactly one axis flipped this is 360 minus `state.rotation`. The
	 * result is the bounding box of the rotated image.
	 */
	rotation?: number;
	/**
	 * The rectangle to keep, as fractions (0-1) of the rotated image's
	 * width and height, from its top left.
	 */
	crop?: NormalizedRect;
}

/**
 * Tolerance (a fraction of the image) used to decide whether a crop rect
 * is effectively full-frame. Sub-pixel / float-ulp deltas below this
 * value are treated as no crop. Matches the historical threshold used by
 * the legacy `use-save-image.js` (which compared against `99.9` percent).
 */
export const CROP_TOLERANCE = 0.001;

/**
 * The person's edit, described against the image loaded in `state.image`.
 *
 * The editor's state describes what the canvas shows: where the image sits
 * under the crop, how far it is zoomed, and a crop area measured against
 * the view. Something that edits the image needs the edit described against
 * the image instead.
 *
 * A crop within `CROP_TOLERANCE` of the whole rotated image is omitted.
 * A locked ratio can produce a crop before the person edits anything.
 *
 * Frames and math:
 *
 * The editor's `cropRect` is stored as fractions of the **snap-rotation**
 * bounding box (the stencil-reference frame — see `createCamera` /
 * `createExportCamera`). Pan is in that frame; zoom scales the image
 * beneath a fixed stencil. Two conversions are needed to reach the frame
 * the crop applies against:
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
 * Rotation sign: the editor composes `flip · R(θ)` on the source (see
 * `createExportCamera` — rotate then flip). The edit's flip-then-rotate
 * order is the opposite: `R(θ') · flip`. For both to land on the
 * same pixels we invert the rotation sign when exactly one flip axis
 * is set (`flip_h · R(θ) = R(-θ) · flip_h`). Both-or-neither flips
 * leave the sign alone because `flip_h · flip_v = -I` commutes with
 * rotation.
 *
 * @param state The editor state. The edit and the loaded image's natural
 *              size are both read from it.
 * @return The edit, or `null` when no image has loaded.
 */
export function getImageEdit( state: ImageEditorState ): ImageEdit | null {
	const edit: ImageEdit = {};
	const { image } = state;

	if ( ! image || ! ( image.naturalWidth > 0 && image.naturalHeight > 0 ) ) {
		return null;
	}

	const imageSize = {
		width: image.naturalWidth,
		height: image.naturalHeight,
	};
	const { cropRect, pan, zoom, flip } = state;
	const hasFlipH = flip.horizontal;
	const hasFlipV = flip.vertical;

	if ( hasFlipH || hasFlipV ) {
		edit.flip = { horizontal: hasFlipH, vertical: hasFlipV };
	}

	const rawAngle = ( ( state.rotation % 360 ) + 360 ) % 360;
	// Invert the sign for single-axis flips so the edit's `flip → rotate`
	// order matches the editor's `rotate → flip` composition.
	const singleAxisFlip = hasFlipH !== hasFlipV;
	const signedAngle = singleAxisFlip ? ( 360 - rawAngle ) % 360 : rawAngle;
	if ( signedAngle !== 0 ) {
		edit.rotation = signedAngle;
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
		edit.crop = { x, y, width, height };
	}

	return edit;
}
