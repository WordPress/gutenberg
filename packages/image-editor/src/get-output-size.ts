import type { ImageEditorState, Size } from './core/types';
import { getRotatedBBox } from './core/camera';
import {
	mapEditToOriginal,
	type OriginalImageEdit,
} from './map-edit-to-original';

/**
 * The size in pixels of the image this edit produces: the part of the
 * original the crop frames, at full size. It is the figure the canvas
 * shows while someone resizes the crop.
 *
 * Use it for a size readout, or to check an edit against a smallest
 * allowed size before saving.
 *
 * It reads the same edits `mapEditToOriginal` returns, so it cannot
 * disagree with what saving produces. A crop that covers the whole image
 * to within a rounding error is no crop at all, and gives the full size.
 *
 * @param state The editor state.
 * @return The output size, or `null` when no image has loaded.
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
