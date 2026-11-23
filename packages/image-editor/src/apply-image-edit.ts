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
 * Why an edit was rejected. `no-image` means no image with a usable size
 * has loaded. `invalid` is a non-finite number or a crop under one pixel
 * wide or high. In strict mode only, `locked-ratio` is a crop that fits
 * the image but not the locked ratio, and `outside-image` is a crop
 * reaching outside the image.
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

// Whether `state` reads back as `edit`. A missing part means none, so a
// near-full crop that `getImageEdit` omits still matches.
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
 * The reverse of `getImageEdit`. The edit replaces the current one: a
 * missing flip or rotation means none, and a missing crop means the crop
 * the editor picks, as when the image is rotated by hand. Only the image
 * and locked ratio are kept from `state`.
 *
 * A crop the image does not cover is fitted as the editor fits one: it
 * shrinks about its centre only as far as its shape needs, then moves the
 * shortest way inside. Under a locked ratio it keeps its centre and width.
 * The pan and zoom are replaced: the crop is centred and zoomed in, as
 * after a resize.
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
	if ( ! numbers.every( Number.isFinite ) ) {
		return { rejected: 'invalid' };
	}

	const flip = {
		horizontal: Boolean( edit.flip?.horizontal ),
		vertical: Boolean( edit.flip?.vertical ),
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

	// The reset starts from the full view, and containment zooms it in as
	// the rotate control does.
	if ( ! crop ) {
		return {
			state: reset( { rotation, flip, aspectRatio: state.aspectRatio } ),
		};
	}

	// The crop is in the rotated image's bounds. The view is the bounds at
	// the nearest quarter turn, on the same centre.
	const rotated = getRotatedBBox(
		image.naturalWidth,
		image.naturalHeight,
		rotation
	);
	if ( crop.width * rotated.width < 1 || crop.height * rotated.height < 1 ) {
		return { rejected: 'invalid' };
	}
	// Keep the crop's centre and width under a locked ratio, as the crop
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
	// If the edit holds without the lock, the lock rejected it.
	if ( state.aspectRatio && holdsEdit( reset( candidate ), edit ) ) {
		return { rejected: 'locked-ratio' };
	}
	return { rejected: 'outside-image' };
}
