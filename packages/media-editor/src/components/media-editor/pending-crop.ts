import { getRotatedBBox } from '../../image-editor/core/camera';
import {
	applyToCanvas,
	canvasToBlob,
	loadImage,
} from '../../image-editor/core/export/canvas-renderer';
import type { CropperState } from '../../image-editor';
import type { Modifier } from '../media-editor-modal/build-modifiers';

/**
 * Longest side, in pixels, of the preview rendered for a pending crop. The
 * preview only has to look right in the editor canvas; the real file is made
 * from the original when the crop is committed.
 */
const MAX_PREVIEW_SIZE = 2048;

/**
 * A crop the user has applied but that hasn't been written to the server yet.
 * The host holds on to it and commits `modifiers` later, e.g. when the post is
 * saved, via `POST /wp/v2/media/{id}/edit`.
 *
 * Everything but `previewUrl` is plain JSON, so it can live in editor state.
 */
export interface MediaEditorPendingCrop {
	/** The `/edit` payload that will make the crop. */
	modifiers: Modifier[];
	/** Cropper geometry, so reopening the editor resumes where the user left off. */
	cropperState: Omit< CropperState, 'image' >;
	/** The aspect-ratio preset that was selected. */
	aspectRatioValue: string;
	/** A `blob:` URL of the cropped image, for previewing it in the host. */
	previewUrl: string;
}

/**
 * Renders the current crop from the original image into a size-capped blob
 * URL. Rejects if the image can't be read back, e.g. a cross-origin image
 * without CORS headers taints the canvas.
 *
 * @param state    The cropper state, with its image loaded.
 * @param mimeType The original's MIME type. Anything that may be transparent
 *                 is previewed as PNG, the rest as JPEG.
 * @return A `blob:` URL of the cropped image.
 */
export async function createPendingCropPreview(
	state: CropperState,
	mimeType?: string
): Promise< string > {
	if ( ! state.image ) {
		throw new Error( 'No image loaded.' );
	}
	const { src, naturalWidth, naturalHeight } = state.image;
	const snapRotation = Math.round( state.rotation / 90 ) * 90;
	const rotBBox = getRotatedBBox( naturalWidth, naturalHeight, snapRotation );
	const width = state.cropRect.width * rotBBox.width;
	const height = state.cropRect.height * rotBBox.height;
	const scale = Math.min( 1, MAX_PREVIEW_SIZE / Math.max( width, height ) );

	const image = await loadImage( src );
	const canvas = applyToCanvas(
		image,
		{ width: naturalWidth, height: naturalHeight },
		state,
		{
			width: Math.max( 1, Math.round( width * scale ) ),
			height: Math.max( 1, Math.round( height * scale ) ),
		}
	);
	const blob = await canvasToBlob(
		canvas,
		mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png'
	);
	return window.URL.createObjectURL( blob );
}

/**
 * Strips the image from the cropper state, leaving only geometry that can be
 * reapplied to the same image later.
 *
 * @param state The cropper state.
 * @return The state without `image`.
 */
export function getPendingCropperState(
	state: CropperState
): MediaEditorPendingCrop[ 'cropperState' ] {
	const { image, ...geometry } = state;
	return geometry;
}
