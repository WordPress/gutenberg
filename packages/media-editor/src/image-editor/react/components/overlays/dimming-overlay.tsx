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
	/** CSS transition string, e.g. during settle animation. */
	transition?: string;
}

// Renders a semi-transparent overlay outside the crop rectangle using a
// box-shadow that dims everything outside the crop rect position.
export function DimmingOverlay( {
	cropRect,
	containerSize,
	imageSize,
	transition,
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

	// Compose any incoming transition with the stylesheet's box-shadow
	// transition so the drag-dimming effect isn't overwritten.
	const composedTransition = transition
		? `${ transition }, box-shadow 0.15s ease`
		: undefined;

	return (
		<div
			className="wp-media-editor-image-editor__dimming"
			data-testid="cropper-dimming"
			style={ {
				left,
				top,
				width,
				height,
				transition: composedTransition,
			} }
		/>
	);
}
