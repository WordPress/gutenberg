/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { HandlePosition, NormalizedRect, Size } from '../../../core/types';

const HANDLE_GAP_PX = 12;

/**
 * Which side of the handle a tooltip axis sits on. `before` places the
 * tooltip on the negative side of the handle (above for Y, left for X),
 * `after` on the positive side, `center` keeps it aligned with the handle.
 */
type AxisSide = 'before' | 'center' | 'after';

interface Anchor {
	x: AxisSide;
	y: AxisSide;
}

const TRANSLATE_PERCENT: Record< AxisSide, string > = {
	before: '-100%',
	center: '-50%',
	after: '0',
};

const GAP_DIRECTION: Record< AxisSide, number > = {
	before: -1,
	center: 0,
	after: 1,
};

const OPPOSITE_SIDE: Record< AxisSide, AxisSide > = {
	before: 'after',
	center: 'center',
	after: 'before',
};

/**
 * Preferred anchor for a handle, before edge-clipping is considered:
 * tooltip sits outward from the crop rectangle's center.
 *
 * @param handle
 */
function preferredAnchor( handle: HandlePosition ): Anchor {
	let x: AxisSide = 'center';
	if ( handle.includes( 'w' ) ) {
		x = 'before';
	} else if ( handle.includes( 'e' ) ) {
		x = 'after';
	}

	let y: AxisSide = 'center';
	if ( handle.includes( 'n' ) ) {
		y = 'before';
	} else if ( handle.includes( 's' ) ) {
		y = 'after';
	}

	return { x, y };
}

/**
 * Start coordinate of a tooltip placed on the given side of `handlePos`,
 * accounting for the per-side handle gap and the tooltip's own length.
 *
 * @param side
 * @param handlePos
 * @param length
 */
function sideStart(
	side: AxisSide,
	handlePos: number,
	length: number
): number {
	if ( side === 'before' ) {
		return handlePos - HANDLE_GAP_PX - length;
	}
	if ( side === 'after' ) {
		return handlePos + HANDLE_GAP_PX;
	}
	return handlePos - length / 2;
}

/**
 * Picks a side that keeps the tooltip inside the container along one
 * axis, preferring the supplied side and falling back to its opposite,
 * then center.
 *
 * @param preferred
 * @param handlePos
 * @param length
 * @param containerLength
 */
function fittingSide(
	preferred: AxisSide,
	handlePos: number,
	length: number,
	containerLength: number
): AxisSide {
	const fits = ( side: AxisSide ) => {
		const start = sideStart( side, handlePos, length );
		return start >= 0 && start + length <= containerLength;
	};

	if ( fits( preferred ) ) {
		return preferred;
	}
	const opposite = OPPOSITE_SIDE[ preferred ];
	if ( opposite !== preferred && fits( opposite ) ) {
		return opposite;
	}
	if ( preferred !== 'center' && fits( 'center' ) ) {
		return 'center';
	}
	// None of the candidates fully fit — pick the one that pushes the
	// least past the container edge. Without this, the chain falls back
	// to `preferred`, which is the off-canvas side that triggered the
	// flip in the first place, so the tooltip ends up clipped.
	const overflow = ( side: AxisSide ) => {
		const start = sideStart( side, handlePos, length );
		return (
			Math.max( 0, -start ) +
			Math.max( 0, start + length - containerLength )
		);
	};
	const candidates: AxisSide[] = [ preferred, opposite, 'center' ];
	return candidates.reduce( ( best, side ) =>
		overflow( side ) < overflow( best ) ? side : best
	);
}

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
	const tooltipRef = useRef< HTMLDivElement >( null );
	const [ tooltipSize, setTooltipSize ] = useState< Size | null >( null );

	// Measure the rendered tooltip so we can flip its anchor when it
	// would otherwise be clipped by the cropper's `overflow: hidden`
	// root. Runs synchronously before paint, so the user never sees
	// the un-flipped position. Tracks `outputWidth`/`outputHeight`
	// because they drive the digit count, the only thing that changes
	// the tooltip's intrinsic size during a drag.
	useLayoutEffect( () => {
		if ( ! tooltipRef.current ) {
			return;
		}
		const rect = tooltipRef.current.getBoundingClientRect();
		setTooltipSize( ( prev ) => {
			if (
				prev &&
				prev.width === rect.width &&
				prev.height === rect.height
			) {
				return prev;
			}
			return { width: rect.width, height: rect.height };
		} );
	}, [ outputWidth, outputHeight ] );

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

	const preferred = preferredAnchor( activeHandle );
	const anchor: Anchor = tooltipSize
		? {
				x: fittingSide(
					preferred.x,
					handleX,
					tooltipSize.width,
					containerSize.width
				),
				y: fittingSide(
					preferred.y,
					handleY,
					tooltipSize.height,
					containerSize.height
				),
		  }
		: preferred;

	return (
		<div
			ref={ tooltipRef }
			className="wp-media-editor-image-editor__dimensions-tooltip"
			data-testid="cropper-dimensions-tooltip"
			style={ {
				left: handleX + GAP_DIRECTION[ anchor.x ] * HANDLE_GAP_PX,
				top: handleY + GAP_DIRECTION[ anchor.y ] * HANDLE_GAP_PX,
				transform: `translate(${ TRANSLATE_PERCENT[ anchor.x ] }, ${
					TRANSLATE_PERCENT[ anchor.y ]
				})`,
			} }
			aria-hidden="true"
		>
			{ `W: ${ Math.round( outputWidth ) }px H: ${ Math.round(
				outputHeight
			) }px` }
		</div>
	);
}
