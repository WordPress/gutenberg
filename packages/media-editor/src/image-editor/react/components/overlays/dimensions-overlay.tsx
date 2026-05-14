/**
 * Internal dependencies
 */
import type { NormalizedRect, Size } from '../../../core/types';

type HandlePosition = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

/**
 * Per-direction transform that anchors the tooltip outward from the
 * crop rectangle's center, so it never overlaps the image when dragging
 * any handle.
 */
const ANCHOR_TRANSFORM: Record< HandlePosition, string > = {
	nw: 'translate(-100%, -100%)',
	n: 'translate(-50%, -100%)',
	ne: 'translate(0, -100%)',
	e: 'translate(0, -50%)',
	se: 'translate(0, 0)',
	s: 'translate(-50%, 0)',
	sw: 'translate(-100%, 0)',
	w: 'translate(-100%, -50%)',
};

const HANDLE_GAP_PX = 12;

/**
 * Per-direction translation away from the handle so the tooltip clears
 * the handle dot and its focus ring.
 */
const HANDLE_OFFSET: Record< HandlePosition, { x: number; y: number } > = {
	nw: { x: -HANDLE_GAP_PX, y: -HANDLE_GAP_PX },
	n: { x: 0, y: -HANDLE_GAP_PX },
	ne: { x: HANDLE_GAP_PX, y: -HANDLE_GAP_PX },
	e: { x: HANDLE_GAP_PX, y: 0 },
	se: { x: HANDLE_GAP_PX, y: HANDLE_GAP_PX },
	s: { x: 0, y: HANDLE_GAP_PX },
	sw: { x: -HANDLE_GAP_PX, y: HANDLE_GAP_PX },
	w: { x: -HANDLE_GAP_PX, y: 0 },
};

interface DimensionsOverlayProps {
	/** Crop rectangle in normalized coordinates. */
	cropRect: NormalizedRect;
	/** Container element dimensions in pixels. */
	containerSize: Size;
	/** Rendered image dimensions in pixels within the container. */
	imageSize: Size;
	/** Currently-dragged handle, or null when no pointer drag is active. */
	activeHandle: HandlePosition | null;
	/** Output crop width in source pixels. */
	outputWidth: number;
	/** Output crop height in source pixels. */
	outputHeight: number;
}

/**
 * Tooltip that follows the active resize handle during a pointer drag,
 * showing the current output dimensions of the crop in source pixels.
 *
 * Renders nothing outside of a pointer-driven resize, so keyboard
 * arrow-key adjustments and pan/zoom gestures stay quiet.
 *
 * @param props
 * @param props.cropRect
 * @param props.containerSize
 * @param props.imageSize
 * @param props.activeHandle
 * @param props.outputWidth
 * @param props.outputHeight
 */
export function DimensionsOverlay( {
	cropRect,
	containerSize,
	imageSize,
	activeHandle,
	outputWidth,
	outputHeight,
}: DimensionsOverlayProps ) {
	if (
		! activeHandle ||
		containerSize.width === 0 ||
		containerSize.height === 0
	) {
		return null;
	}

	const offsetX = ( containerSize.width - imageSize.width ) / 2;
	const offsetY = ( containerSize.height - imageSize.height ) / 2;
	const left = offsetX + cropRect.x * imageSize.width;
	const top = offsetY + cropRect.y * imageSize.height;
	const width = cropRect.width * imageSize.width;
	const height = cropRect.height * imageSize.height;

	// Handle pixel position within the container. Same math as the
	// stencil's handle layout, just keyed by direction here so the
	// tooltip can anchor to any of the eight.
	let handleX = left + width / 2;
	if ( activeHandle.includes( 'w' ) ) {
		handleX = left;
	} else if ( activeHandle.includes( 'e' ) ) {
		handleX = left + width;
	}
	let handleY = top + height / 2;
	if ( activeHandle.includes( 'n' ) ) {
		handleY = top;
	} else if ( activeHandle.includes( 's' ) ) {
		handleY = top + height;
	}

	const gap = HANDLE_OFFSET[ activeHandle ];

	return (
		<div
			className="wp-media-editor-image-editor__dimensions-tooltip"
			data-testid="cropper-dimensions-tooltip"
			style={ {
				left: handleX + gap.x,
				top: handleY + gap.y,
				transform: ANCHOR_TRANSFORM[ activeHandle ],
			} }
			aria-hidden="true"
		>
			{ `W: ${ Math.round( outputWidth ) }px H: ${ Math.round(
				outputHeight
			) }px` }
		</div>
	);
}
