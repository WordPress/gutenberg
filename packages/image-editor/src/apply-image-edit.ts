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
 * Why an edit could not be applied.
 *
 *   - `no-image`:      no image has loaded.
 *   - `invalid`:       a value is not a usable number, or the crop has no
 *     area.
 *   - `locked-ratio`:  the crop's shape breaks the ratio the state has
 *     locked.
 *   - `outside-image`: the crop reaches outside the rotated image.
 */
export type ImageEditRejection =
	'no-image' | 'invalid' | 'locked-ratio' | 'outside-image';

/** The new state, or the reason there is none. */
export type ApplyImageEditResult =
	{ state: ImageEditorState } | { rejected: ImageEditRejection };

const WHOLE_IMAGE: NormalizedRect = { x: 0, y: 0, width: 1, height: 1 };

/**
 * Whether reading `state` gives back `edit`. A missing part counts as the
 * value that changes nothing, so a nearly full crop that `getImageEdit`
 * omits still matches the crop that was asked for.
 *
 * @param state The state to read.
 * @param edit  The edit it should hold.
 * @return Whether they match within `CROP_TOLERANCE`.
 */
function holdsEdit( state: ImageEditorState, edit: ImageEdit ): boolean {
	const held = getImageEdit( state );
	if ( ! held ) {
		return false;
	}
	const difference =
		( ( held.rotation ?? 0 ) - ( edit.rotation ?? 0 ) + 540 ) % 360;
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
 * Turn an edit into an editor state, with no canvas involved.
 *
 * The edit is the whole edit: a part left out means none, whatever flip,
 * rotation or crop `state` had. Only the image and the locked ratio are
 * taken from `state`.
 *
 * An edit says which pixels to keep, not how the canvas shows them, so
 * the view is chosen here: the crop is centred and its longer side fills
 * the view, as it is after a person finishes resizing. The pan and zoom
 * `state` had are replaced.
 *
 * Nothing is approximated. The result is read back with `getImageEdit`,
 * and an edit the editor cannot hold is rejected.
 *
 * @param state The editor state the edit is for.
 * @param edit  The edit, in the shape `getImageEdit` returns.
 * @return The new state, or the reason the edit was rejected.
 */
export function applyImageEdit(
	state: ImageEditorState,
	edit: ImageEdit
): ApplyImageEditResult {
	const { image } = state;
	if ( ! image || image.naturalWidth === 0 || image.naturalHeight === 0 ) {
		return { rejected: 'no-image' };
	}

	const crop = edit.crop ?? WHOLE_IMAGE;
	const numbers = [
		edit.rotation ?? 0,
		crop.x,
		crop.y,
		crop.width,
		crop.height,
	];
	if (
		! numbers.every( Number.isFinite ) ||
		crop.width <= 0 ||
		crop.height <= 0
	) {
		return { rejected: 'invalid' };
	}

	const flip = {
		horizontal: Boolean( edit.flip?.horizontal ),
		vertical: Boolean( edit.flip?.vertical ),
	};
	// The edit rotates after the flip and the editor before it, so one
	// flipped axis reverses the angle. This undoes the rule in
	// `getImageEdit`.
	const angle = ( ( ( edit.rotation ?? 0 ) % 360 ) + 360 ) % 360;
	const rotation =
		flip.horizontal !== flip.vertical ? ( 360 - angle ) % 360 : angle;

	// The crop is measured on the rotated image. The view is measured on
	// the image at its nearest quarter turn, with the same centre.
	const view = getRotatedBBox(
		image.naturalWidth,
		image.naturalHeight,
		Math.round( rotation / 90 ) * 90
	);
	const rotated = getRotatedBBox(
		image.naturalWidth,
		image.naturalHeight,
		rotation
	);
	const left =
		( crop.x * rotated.width - ( rotated.width - view.width ) / 2 ) /
		view.width;
	const top =
		( crop.y * rotated.height - ( rotated.height - view.height ) / 2 ) /
		view.height;
	const width = ( crop.width * rotated.width ) / view.width;
	const height = ( crop.height * rotated.height ) / view.height;

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

	const reset = (
		payload: Partial< InternalImageEditorState >
	): ImageEditorState =>
		imageEditorReducer( withBaseValues( state ), {
			type: 'RESET',
			payload,
		} );

	const next = reset( { ...candidate, aspectRatio: state.aspectRatio } );
	if ( holdsEdit( next, edit ) ) {
		return { state: next };
	}
	// The same edit with no ratio locked tells the two causes apart.
	if ( state.aspectRatio && holdsEdit( reset( candidate ), edit ) ) {
		return { rejected: 'locked-ratio' };
	}
	return { rejected: 'outside-image' };
}
