import type { ImageEditorState, Size } from './core/types';
import { getRotatedBBox } from './core/camera';
import { getImageEdit } from './get-image-edit';

/**
 * The dimensions that the edit from `getImageEdit` would produce on the
 * image in `state.image`.
 *
 * A nearly full crop that `getImageEdit` omits gives the full image size.
 * Use this for a size readout or a minimum-size check against the loaded
 * image. A processor that edits a different file or rounds pixels may
 * produce different dimensions.
 *
 * @param state The editor state.
 * @return The calculated dimensions, or `null` when no image has loaded.
 */
export function getOutputSize( state: ImageEditorState ): Size | null {
	const { image } = state;
	if ( ! image || ! ( image.naturalWidth > 0 && image.naturalHeight > 0 ) ) {
		return null;
	}

	const edit = getImageEdit( state );
	if ( ! edit ) {
		return null;
	}

	// The crop is in fractions of the image at its rotation, so that is
	// the size to take the fractions of.
	const rotated = getRotatedBBox(
		image.naturalWidth,
		image.naturalHeight,
		edit.rotation ?? 0
	);
	if ( ! edit.crop ) {
		return { width: rotated.width, height: rotated.height };
	}
	return {
		width: edit.crop.width * rotated.width,
		height: edit.crop.height * rotated.height,
	};
}
