import type { ImageEditorState, Size } from './core/types';
import { withBaseValues } from './core/state';
import { getSourceRegion } from './core/source-region';

/**
 * The size in pixels of the image this edit produces: the part of the
 * original the crop frames, at full size. It is the figure the canvas
 * shows while someone resizes the crop.
 *
 * Use it for a size readout, or to check an edit against a smallest
 * allowed size before saving.
 *
 * @param state The editor state.
 * @return The output size, or `null` when no image has loaded.
 */
export function getOutputSize( state: ImageEditorState ): Size | null {
	const { image } = state;
	if ( ! image || image.naturalWidth === 0 || image.naturalHeight === 0 ) {
		return null;
	}
	const region = getSourceRegion( withBaseValues( state ), {
		width: image.naturalWidth,
		height: image.naturalHeight,
	} );
	return { width: region.width, height: region.height };
}
