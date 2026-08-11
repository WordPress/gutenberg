import type { NormalizedRect, Size } from '../../../core/types';

interface CropPreviewOverlayProps {
	cropRect: NormalizedRect;
	containerSize: Size;
	imageSize: Size;
}

/**
 * Renders a non-interactive draft crop rectangle while sidebar controls are
 * being edited.
 *
 * @param props               Component props.
 * @param props.cropRect      Draft crop rectangle in normalized coordinates.
 * @param props.containerSize The container element dimensions in pixels.
 * @param props.imageSize     The rendered image dimensions in pixels.
 * @return The preview overlay, or null before measurement.
 */
export function CropPreviewOverlay( {
	cropRect,
	containerSize,
	imageSize,
}: CropPreviewOverlayProps ) {
	if ( containerSize.width === 0 || containerSize.height === 0 ) {
		return null;
	}

	const offsetX = ( containerSize.width - imageSize.width ) / 2;
	const offsetY = ( containerSize.height - imageSize.height ) / 2;
	const left = offsetX + cropRect.x * imageSize.width;
	const top = offsetY + cropRect.y * imageSize.height;
	const width = cropRect.width * imageSize.width;
	const height = cropRect.height * imageSize.height;

	return (
		<div
			className="wp-media-editor-image-editor__preview-rect"
			data-testid="cropper-preview-rect"
			style={ { left, top, width, height } }
		/>
	);
}
