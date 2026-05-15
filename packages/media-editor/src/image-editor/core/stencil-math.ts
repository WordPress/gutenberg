/**
 * Internal dependencies
 */
import type { HandlePosition, NormalizedRect, Size } from './types';

export type { HandlePosition };

/** Minimum crop rect dimension in normalized space (5% of visual area). */
export const MIN_CROP_SIZE = 0.05;

/**
 * Bounds within which the crop rect must stay.
 */
export interface CropBounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

/**
 * Drag state for tracking a resize interaction.
 */
export interface ResizeDragState {
	/** Which handle is being dragged. */
	handle: HandlePosition;
	/** The mouse position (pixels) when the drag started. */
	startX: number;
	startY: number;
	/** The crop rect (normalized) when the drag started. */
	startRect: NormalizedRect;
}

/**
 * Compute the new crop rect for a free (no aspect ratio) resize.
 *
 * Each edge moves independently based on the handle being dragged.
 * Edges are clamped to the provided bounds and maintain a minimum size.
 *
 * @param drag      The current drag state.
 * @param clientX   Current mouse/touch X position in pixels.
 * @param clientY   Current mouse/touch Y position in pixels.
 * @param imageSize The rendered image dimensions in pixels.
 * @param bounds    The allowed crop area bounds.
 * @return The new crop rect in normalized coordinates.
 */
export function computeFreeResizeRect(
	drag: ResizeDragState,
	clientX: number,
	clientY: number,
	imageSize: Size,
	bounds: CropBounds
): NormalizedRect {
	const dx =
		imageSize.width > 0 ? ( clientX - drag.startX ) / imageSize.width : 0;
	const dy =
		imageSize.height > 0 ? ( clientY - drag.startY ) / imageSize.height : 0;

	const s = drag.startRect;
	const handle = drag.handle;

	let edgeTop = s.y;
	let edgeBottom = s.y + s.height;
	let edgeLeft = s.x;
	let edgeRight = s.x + s.width;

	if ( handle === 'n' || handle === 'nw' || handle === 'ne' ) {
		edgeTop = Math.max(
			bounds.minY,
			Math.min( s.y + dy, edgeBottom - MIN_CROP_SIZE )
		);
	}
	if ( handle === 's' || handle === 'sw' || handle === 'se' ) {
		edgeBottom = Math.max(
			edgeTop + MIN_CROP_SIZE,
			Math.min( s.y + s.height + dy, bounds.maxY )
		);
	}
	if ( handle === 'w' || handle === 'nw' || handle === 'sw' ) {
		edgeLeft = Math.max(
			bounds.minX,
			Math.min( s.x + dx, edgeRight - MIN_CROP_SIZE )
		);
	}
	if ( handle === 'e' || handle === 'ne' || handle === 'se' ) {
		edgeRight = Math.max(
			edgeLeft + MIN_CROP_SIZE,
			Math.min( s.x + s.width + dx, bounds.maxX )
		);
	}

	return {
		x: edgeLeft,
		y: edgeTop,
		width: edgeRight - edgeLeft,
		height: edgeBottom - edgeTop,
	};
}

/**
 * Compute the new crop rect for a locked-aspect-ratio corner resize.
 *
 * The opposite corner is the anchor. The dragged corner moves freely
 * but the result is clamped to maintain the aspect ratio and stay
 * within bounds.
 *
 * @param drag            The current drag state.
 * @param clientX         Current mouse/touch X position in pixels.
 * @param clientY         Current mouse/touch Y position in pixels.
 * @param imageSize       The rendered image dimensions in pixels.
 * @param bounds          The allowed crop area bounds.
 * @param normalizedRatio The locked aspect ratio (width / height in normalized space).
 * @return The new crop rect in normalized coordinates.
 */
export function computeLockedResizeRect(
	drag: ResizeDragState,
	clientX: number,
	clientY: number,
	imageSize: Size,
	bounds: CropBounds,
	normalizedRatio: number
): NormalizedRect {
	// The math below divides by `normalizedRatio` and `imageSize`, so
	// bail out with the start rect when any of them is zero. This can
	// happen if a resize is triggered (e.g. via keyboard arrows on a
	// focused handle) before the image has loaded.
	if (
		normalizedRatio <= 0 ||
		imageSize.width <= 0 ||
		imageSize.height <= 0
	) {
		return { ...drag.startRect };
	}

	const dx = ( clientX - drag.startX ) / imageSize.width;
	const dy = ( clientY - drag.startY ) / imageSize.height;

	const s = drag.startRect;
	const handle = drag.handle;

	// Determine the anchor corner (opposite to the dragged corner).
	const anchorX = handle === 'nw' || handle === 'sw' ? s.x + s.width : s.x;
	const anchorY = handle === 'nw' || handle === 'ne' ? s.y + s.height : s.y;

	// Direction the crop grows from the anchor (+1 = right/down, -1 = left/up).
	const dirX = handle === 'nw' || handle === 'sw' ? -1 : 1;
	const dirY = handle === 'nw' || handle === 'ne' ? -1 : 1;

	// Desired new position of the dragged corner.
	const draggedX =
		( handle === 'nw' || handle === 'sw' ? s.x : s.x + s.width ) + dx;
	const draggedY =
		( handle === 'nw' || handle === 'ne' ? s.y : s.y + s.height ) + dy;

	// Raw distances from anchor to dragged corner.
	let distW = ( draggedX - anchorX ) * dirX;
	let distH = ( draggedY - anchorY ) * dirY;

	// Enforce minimum size.
	distW = Math.max( distW, MIN_CROP_SIZE );
	distH = Math.max( distH, MIN_CROP_SIZE );

	// Determine which axis "drives" — whichever the user moved more
	// (in pixel space) determines the size, the other follows. The
	// `normalizedRatio` is w/h in normalized space; the equivalent
	// pixel-space ratio is `normalizedRatio * imageW / imageH`. We
	// compare the pixel motion ratio against that pixel-space ratio
	// so the units line up (was a unit mismatch on non-square images).
	const pixelDistW = distW * imageSize.width;
	const pixelDistH = distH * imageSize.height;
	const pixelRatio = ( normalizedRatio * imageSize.width ) / imageSize.height;
	if ( pixelDistW / pixelDistH > pixelRatio ) {
		// Width is the driver — compute height from ratio.
		distH = distW / normalizedRatio;
	} else {
		// Height is the driver — compute width from ratio.
		distW = distH * normalizedRatio;
	}

	// Clamp to image coverage bounds. If the rect would exceed,
	// shrink it (maintaining ratio) to fit.
	const maxW = dirX > 0 ? bounds.maxX - anchorX : anchorX - bounds.minX;
	const maxH = dirY > 0 ? bounds.maxY - anchorY : anchorY - bounds.minY;

	if ( distW > maxW ) {
		distW = maxW;
		distH = distW / normalizedRatio;
	}
	if ( distH > maxH ) {
		distH = maxH;
		distW = distH * normalizedRatio;
	}

	// Enforce minimum after clamping.
	distW = Math.max( distW, MIN_CROP_SIZE );
	distH = Math.max( distH, MIN_CROP_SIZE );

	// Compute the final rect position from the anchor.
	const newX = dirX > 0 ? anchorX : anchorX - distW;
	const newY = dirY > 0 ? anchorY : anchorY - distH;

	return { x: newX, y: newY, width: distW, height: distH };
}

/**
 * Compute the new crop rect for a resize that temporarily locks the
 * aspect ratio to `drag.startRect`'s ratio (e.g. while Shift is held).
 *
 * Corner handles delegate to {@link computeLockedResizeRect}. Edge
 * handles size the dragged axis freely, then expand the perpendicular
 * axis symmetrically around the rect's center to preserve the ratio,
 * clamping symmetrically so the rect stays within bounds.
 *
 * @param drag      The current drag state.
 * @param clientX   Current mouse/touch X position in pixels.
 * @param clientY   Current mouse/touch Y position in pixels.
 * @param imageSize The rendered image dimensions in pixels.
 * @param bounds    The allowed crop area bounds.
 * @return The new crop rect in normalized coordinates.
 */
export function computeShiftLockedResizeRect(
	drag: ResizeDragState,
	clientX: number,
	clientY: number,
	imageSize: Size,
	bounds: CropBounds
): NormalizedRect {
	const s = drag.startRect;
	const pixelW = s.width * imageSize.width;
	const pixelH = s.height * imageSize.height;
	if ( pixelH <= 0 || pixelW <= 0 ) {
		return computeFreeResizeRect(
			drag,
			clientX,
			clientY,
			imageSize,
			bounds
		);
	}
	const normalizedRatio = s.width / s.height;

	const handle = drag.handle;
	if (
		handle === 'nw' ||
		handle === 'ne' ||
		handle === 'sw' ||
		handle === 'se'
	) {
		return computeLockedResizeRect(
			drag,
			clientX,
			clientY,
			imageSize,
			bounds,
			normalizedRatio
		);
	}

	// Edge handle: size the dragged axis with free-resize logic, then
	// expand the perpendicular axis symmetrically around the rect's center.
	const free = computeFreeResizeRect(
		drag,
		clientX,
		clientY,
		imageSize,
		bounds
	);

	if ( handle === 'n' || handle === 's' ) {
		// Height is the driver; derive width from ratio.
		let newHeight = free.height;
		let newWidth = newHeight * normalizedRatio;
		const centerX = s.x + s.width / 2;
		// Symmetric clamp: limit by the smaller of the two side gaps so
		// the rect stays centered around centerX.
		const maxWidth =
			Math.min( centerX - bounds.minX, bounds.maxX - centerX ) * 2;
		if ( newWidth > maxWidth ) {
			newWidth = maxWidth;
			newHeight = newWidth / normalizedRatio;
		}
		// Enforce the minimum on the driving axis, then derive the
		// other axis from the ratio so it stays consistent. The
		// effective minimum height has to satisfy MIN_CROP_SIZE on
		// both axes simultaneously.
		const minHeight = Math.max(
			MIN_CROP_SIZE,
			MIN_CROP_SIZE / normalizedRatio
		);
		if ( newHeight < minHeight ) {
			newHeight = minHeight;
			newWidth = newHeight * normalizedRatio;
		}
		// Re-anchor the dragged axis to the opposite edge so the
		// height adjustment after clamping keeps that edge fixed.
		const newY = handle === 'n' ? s.y + s.height - newHeight : s.y;
		return {
			x: centerX - newWidth / 2,
			y: newY,
			width: newWidth,
			height: newHeight,
		};
	}

	// 'e' or 'w': width is the driver; derive height from ratio.
	let newWidth = free.width;
	let newHeight = newWidth / normalizedRatio;
	const centerY = s.y + s.height / 2;
	const maxHeight =
		Math.min( centerY - bounds.minY, bounds.maxY - centerY ) * 2;
	if ( newHeight > maxHeight ) {
		newHeight = maxHeight;
		newWidth = newHeight * normalizedRatio;
	}
	const minWidth = Math.max( MIN_CROP_SIZE, MIN_CROP_SIZE * normalizedRatio );
	if ( newWidth < minWidth ) {
		newWidth = minWidth;
		newHeight = newWidth / normalizedRatio;
	}
	const newX = handle === 'w' ? s.x + s.width - newWidth : s.x;
	return {
		x: newX,
		y: centerY - newHeight / 2,
		width: newWidth,
		height: newHeight,
	};
}
