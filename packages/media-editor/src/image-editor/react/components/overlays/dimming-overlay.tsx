/**
 * Internal dependencies
 */
import type { NormalizedRect, Size } from '../../../core/types';

/**
 * Props for the DimmingOverlay component.
 */
interface DimmingOverlayProps {
	/** The crop rectangle in normalized coordinates. */
	cropRect: NormalizedRect;
	/** The container element dimensions in pixels. */
	containerSize: Size;
	/** The rendered image dimensions in pixels within the container. */
	imageSize: Size;
}

/**
 * Renders a semi-transparent overlay outside the crop rectangle.
 *
 * Uses the box-shadow approach: a div matching the crop rect position
 * with a large box-shadow that dims everything outside it.
 *
 * @param props               Component props.
 * @param props.cropRect      The crop rectangle in normalized coordinates.
 * @param props.containerSize The container element dimensions in pixels.
 * @param props.imageSize     The rendered image dimensions in pixels.
 * @return The dimming overlay element.
 */
export function DimmingOverlay( {
	cropRect,
	containerSize,
	imageSize,
}: DimmingOverlayProps ) {
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
			className="wp-media-editor-image-editor__dimming"
			style={ {
				left,
				top,
				width,
				height,
			} }
		/>
	);
}
