import type { ImageEditorState, Size } from './core/types';
import { getRotatedBBox } from './core/camera';
import { getImageEdits, type ImageEdit } from './get-image-edits';

/**
 * The dimensions that the edits from `getImageEdits` would produce
 * on the image in `state.image`.
 *
 * A nearly full crop that the mapper omits gives the full image size.
 * Use this for a size readout or a minimum-size check against the loaded
 * image. A processor that edits a different file or rounds pixels may
 * produce different dimensions.
 *
 * @param state The editor state.
 * @return The calculated dimensions, or `null` when no image has loaded.
 */
export function getOutputSize( state: ImageEditorState ): Size | null {
	const { image } = state;
	if ( ! image || image.naturalWidth === 0 || image.naturalHeight === 0 ) {
		return null;
	}

	let angle = 0;
	let crop: Extract< ImageEdit, { type: 'crop' } > | undefined;
	for ( const edit of getImageEdits( state ) ) {
		if ( edit.type === 'rotate' ) {
			angle = edit.angle;
		} else if ( edit.type === 'crop' ) {
			crop = edit;
		}
	}

	// The crop is in fractions of the image at its rotation, so that is
	// the size to take the fractions of.
	const rotated = getRotatedBBox(
		image.naturalWidth,
		image.naturalHeight,
		angle
	);
	if ( ! crop ) {
		return { width: rotated.width, height: rotated.height };
	}
	return {
		width: crop.width * rotated.width,
		height: crop.height * rotated.height,
	};
}
