import type { ImageEditorState, Size } from './core/types';
import { getRotatedBBox } from './core/camera';
import {
	mapEditToOriginal,
	type OriginalImageEdit,
} from './map-edit-to-original';

/**
 * The size in pixels of the part of the image the crop frames, at full
 * size.
 *
 * Use it for a size readout, or to check an edit against a smallest
 * allowed size before saving.
 *
 * It reads the same edits `mapEditToOriginal` returns, so it measures
 * the region saving keeps and not some other one. The size is in the
 * pixels of `state.image`, so a save path that applies those edits to a
 * larger copy of that image writes a larger file, in proportion. A crop
 * that covers the whole image to within a rounding error is no crop at
 * all, and gives the full size.
 *
 * @param state The editor state.
 * @return The size of the framed region, or `null` when no image has loaded.
 */
export function getOutputSize( state: ImageEditorState ): Size | null {
	const { image } = state;
	if ( ! image || image.naturalWidth === 0 || image.naturalHeight === 0 ) {
		return null;
	}

	let angle = 0;
	let crop: Extract< OriginalImageEdit, { type: 'crop' } > | undefined;
	for ( const edit of mapEditToOriginal( state ) ) {
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
