/**
 * Internal dependencies
 */
import type { NormalizedRect, Size } from '../../../core/types';

/**
 * Props for the GridOverlay component.
 */
interface GridOverlayProps {
	/** The crop rectangle in normalized coordinates. */
	cropRect: NormalizedRect;
	/** The container element dimensions in pixels. */
	containerSize: Size;
	/** The rendered image dimensions in pixels within the container. */
	imageSize: Size;
	/** Opacity of the grid overlay (0-1). Defaults to 1. */
	opacity?: number;
}

/**
 * Renders a rule-of-thirds grid inside the crop rectangle.
 *
 * Displays 2 horizontal and 2 vertical lines at 1/3 and 2/3
 * positions within the crop area.
 *
 * @param props               Component props.
 * @param props.cropRect      The crop rectangle in normalized coordinates.
 * @param props.containerSize The container element dimensions in pixels.
 * @param props.imageSize     The rendered image dimensions in pixels.
 * @param props.opacity       Opacity of the overlay (0-1).
 * @return The grid overlay element.
 */
export function GridOverlay( {
	cropRect,
	containerSize,
	imageSize,
	opacity = 1,
}: GridOverlayProps ) {
	if ( containerSize.width === 0 || containerSize.height === 0 ) {
		return null;
	}

	const offsetX = ( containerSize.width - imageSize.width ) / 2;
	const offsetY = ( containerSize.height - imageSize.height ) / 2;
	const left = offsetX + cropRect.x * imageSize.width;
	const top = offsetY + cropRect.y * imageSize.height;
	const width = cropRect.width * imageSize.width;
	const height = cropRect.height * imageSize.height;

	const thirdW = width / 3;
	const thirdH = height / 3;

	return (
		<div
			className="wp-media-editor-image-editor__grid"
			style={ {
				left,
				top,
				width,
				height,
				opacity,
			} }
		>
			{ /* Horizontal lines at 1/3 and 2/3 */ }
			<div
				className="wp-media-editor-image-editor__grid-line wp-media-editor-image-editor__grid-line--horizontal"
				style={ { top: thirdH } }
			/>
			<div
				className="wp-media-editor-image-editor__grid-line wp-media-editor-image-editor__grid-line--horizontal"
				style={ { top: thirdH * 2 } }
			/>
			{ /* Vertical lines at 1/3 and 2/3 */ }
			<div
				className="wp-media-editor-image-editor__grid-line wp-media-editor-image-editor__grid-line--vertical"
				style={ { left: thirdW } }
			/>
			<div
				className="wp-media-editor-image-editor__grid-line wp-media-editor-image-editor__grid-line--vertical"
				style={ { left: thirdW * 2 } }
			/>
		</div>
	);
}
