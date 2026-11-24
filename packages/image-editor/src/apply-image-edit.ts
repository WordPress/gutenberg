import type {
	ImageEditorState,
	InternalImageEditorState,
	NormalizedRect,
} from './core/types';
import { getRotatedBBox } from './core/camera';
import { MAX_ZOOM } from './core/constants';
import { imageEditorReducer, withBaseValues } from './core/state';
import { CROP_TOLERANCE, getImageEdit, type ImageEdit } from './get-image-edit';

/**
 * Why an edit was rejected.
 *
 * - `no-image`: no image with a usable size has loaded.
 * - `invalid`: a number is not finite, a flip value is not a boolean, or
 *   the crop is under one pixel wide or high.
 * - `locked-ratio`: strict mode only. The crop fits the image but not the
 *   locked ratio.
 * - `outside-image`: strict mode only. The crop reaches outside the image.
 */
export type ImageEditRejection =
	'no-image' | 'invalid' | 'locked-ratio' | 'outside-image';

export interface ApplyImageEditOptions {
	/**
	 * Reject a crop that needs fitting, instead of fitting it. A missing
	 * crop is left to the editor.
	 */
	strict?: boolean;
}

export type ApplyImageEditResult =
	{ state: ImageEditorState } | { rejected: ImageEditRejection };

const WHOLE_IMAGE: NormalizedRect = { x: 0, y: 0, width: 1, height: 1 };

// Compares the edit `state` holds, read back with `getImageEdit`, with
// `edit`: the same flip, rotation and crop, within tolerance. On both
// sides a missing flip is no flip, a missing rotation is 0 degrees, and a
// missing crop is the whole image, which is how `getImageEdit` describes a
// crop that covers nearly all of it.
function holdsEdit( state: ImageEditorState, edit: ImageEdit ): boolean {
	const held = getImageEdit( state );
	if ( ! held ) {
		return false;
	}
	const offset = ( ( held.rotation ?? 0 ) - ( edit.rotation ?? 0 ) ) % 360;
	const difference = ( offset + 540 ) % 360;
	const heldCrop = held.crop ?? WHOLE_IMAGE;
	const crop = edit.crop ?? WHOLE_IMAGE;
	return (
		Boolean( held.flip?.horizontal ) === Boolean( edit.flip?.horizontal ) &&
		Boolean( held.flip?.vertical ) === Boolean( edit.flip?.vertical ) &&
		Math.abs( difference - 180 ) < 1e-6 &&
		Math.abs( heldCrop.x - crop.x ) <= CROP_TOLERANCE &&
		Math.abs( heldCrop.y - crop.y ) <= CROP_TOLERANCE &&
		Math.abs( heldCrop.width - crop.width ) <= CROP_TOLERANCE &&
		Math.abs( heldCrop.height - crop.height ) <= CROP_TOLERANCE
	);
}

/**
 * Builds the editor state that shows `edit`: the reverse of `getImageEdit`.
 *
 * The result holds only the flip, rotation and crop in `edit`. Whatever
 * `state` was showing is dropped, except its image and its locked ratio.
 * Leave out `flip` for no flip, `rotation` for no rotation, and `crop` for
 * the crop the editor would pick itself: the whole image, unless a fine
 * rotation or a locked ratio shrinks it.
 *
 * The image must cover the crop. If it does not, the crop is fitted the
 * same way the editor fits one: it shrinks toward its center, keeping its
 * shape, until the image can cover it, then moves the shortest way inside.
 * A locked ratio changes the crop's height to match and keeps its center
 * and width. The pan and zoom are worked out again so the crop sits
 * centered and fills the view, as after a resize.
 *
 * @param state          Only its image and locked ratio are used.
 * @param edit           The edit to apply, replacing the current one.
 * @param options
 * @param options.strict Reject a crop that needs fitting, rather than fit it.
 */
export function applyImageEdit(
	state: ImageEditorState,
	edit: ImageEdit,
	{ strict = false }: ApplyImageEditOptions = {}
): ApplyImageEditResult {
	const { image } = state;
	if ( ! image || ! ( image.naturalWidth > 0 && image.naturalHeight > 0 ) ) {
		return { rejected: 'no-image' };
	}

	const { crop } = edit;
	const numbers = [ edit.rotation ?? 0 ];
	if ( crop ) {
		numbers.push( crop.x, crop.y, crop.width, crop.height );
	}
	const flips = [ edit.flip?.horizontal, edit.flip?.vertical ];
	if (
		! numbers.every( Number.isFinite ) ||
		! flips.every(
			( value ) => value === undefined || typeof value === 'boolean'
		)
	) {
		return { rejected: 'invalid' };
	}

	const flip = {
		horizontal: edit.flip?.horizontal ?? false,
		vertical: edit.flip?.vertical ?? false,
	};
	// Undoes the sign rule in `getImageEdit`: one flipped axis reverses
	// the angle.
	const angle = ( ( ( edit.rotation ?? 0 ) % 360 ) + 360 ) % 360;
	const rotation =
		flip.horizontal !== flip.vertical ? ( 360 - angle ) % 360 : angle;

	const reset = (
		payload: Partial< InternalImageEditorState >
	): ImageEditorState =>
		imageEditorReducer( withBaseValues( state ), {
			type: 'RESET',
			payload,
		} );

	// With no crop, the reset frames the whole image. Under a fine rotation,
	// containment then zooms in, as the rotate control does.
	if ( ! crop ) {
		return {
			state: reset( { rotation, flip, aspectRatio: state.aspectRatio } ),
		};
	}

	// The crop is a fraction of the rotated image's bounding box. The view
	// is the bounding box at the nearest quarter turn, with the same center.
	const rotated = getRotatedBBox(
		image.naturalWidth,
		image.naturalHeight,
		rotation
	);
	if ( crop.width * rotated.width < 1 || crop.height * rotated.height < 1 ) {
		return { rejected: 'invalid' };
	}
	// Under a locked ratio, keep the crop's center and width, as the crop
	// setter does. Containment then fits it if it has no room. Strict skips
	// this, so the lock check below judges the crop as passed.
	const ratio = state.aspectRatio;
	let { y, height: cropHeight } = crop;
	if ( ! strict && ratio && ratio > 0 ) {
		cropHeight = ( crop.width * rotated.width ) / ratio / rotated.height;
		y = crop.y + ( crop.height - cropHeight ) / 2;
	}
	const view = getRotatedBBox(
		image.naturalWidth,
		image.naturalHeight,
		Math.round( rotation / 90 ) * 90
	);
	const left =
		( crop.x * rotated.width - ( rotated.width - view.width ) / 2 ) /
		view.width;
	const top =
		( y * rotated.height - ( rotated.height - view.height ) / 2 ) /
		view.height;
	const width = ( crop.width * rotated.width ) / view.width;
	const height = ( cropHeight * rotated.height ) / view.height;

	const zoom = Math.min( 1 / Math.max( width, height ), MAX_ZOOM );
	const cropRect = {
		x: ( 1 - zoom * width ) / 2,
		y: ( 1 - zoom * height ) / 2,
		width: zoom * width,
		height: zoom * height,
	};
	const candidate = {
		rotation,
		flip,
		zoom,
		pan: {
			x: cropRect.x - 0.5 + zoom / 2 - zoom * left,
			y: cropRect.y - 0.5 + zoom / 2 - zoom * top,
		},
		cropRect,
	};

	const next = reset( { ...candidate, aspectRatio: state.aspectRatio } );
	if ( ! strict || holdsEdit( next, edit ) ) {
		return { state: next };
	}
	// If the edit applies without the lock, the lock is what rejected it.
	if ( state.aspectRatio && holdsEdit( reset( candidate ), edit ) ) {
		return { rejected: 'locked-ratio' };
	}
	return { rejected: 'outside-image' };
}
