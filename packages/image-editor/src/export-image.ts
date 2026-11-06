import type { ImageEditorState } from './core/types';
import { withBaseValues } from './core/state';
import { exportCroppedImage } from './core/export/canvas-renderer';

/**
 * How to encode the exported image.
 */
export interface ExportImageOptions {
	/** The MIME type of the file. Defaults to `image/png`. */
	type?: string;
	/** The quality for lossy types such as `image/jpeg`, from 0 to 1. */
	quality?: number;
}

/**
 * Export the edited image as a file, in the browser.
 *
 * Loads the image in `state.image`, draws the region the crop frames with
 * the flip, rotation and zoom applied, and encodes it. The result has the
 * dimensions `getOutputSize( state )` reports. Use it when the edited image
 * is uploaded as a new file rather than applied to the original by a
 * server.
 *
 * The image is loaded with `crossOrigin` set to `anonymous`, so a source
 * on another origin needs CORS headers, or encoding fails.
 *
 * @param state           The editor state, with an image loaded.
 * @param options         The file type and quality.
 * @param options.type    The MIME type of the file. Defaults to `image/png`.
 * @param options.quality The quality for lossy types, from 0 to 1.
 * @return The encoded image. Rejects when no image has loaded, when the
 *         image fails to load, or when the browser refuses to read the
 *         canvas.
 */
export function exportImage(
	state: ImageEditorState,
	{ type, quality }: ExportImageOptions = {}
): Promise< Blob > {
	if ( ! state.image ) {
		return Promise.reject(
			new Error( 'No image has loaded, so there is nothing to export.' )
		);
	}
	// The renderer's camera reads the base pan, zoom and rotation the
	// editor keeps for itself. A state built outside the editor lacks them.
	return exportCroppedImage(
		state.image.src,
		withBaseValues( state ),
		type,
		quality
	);
}
