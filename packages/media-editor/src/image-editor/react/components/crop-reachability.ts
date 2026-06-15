/**
 * Internal dependencies
 */
import type { NormalizedRect, Size } from '../../core/types';

/**
 * Minimum visible crop edge before the crop is considered recoverable. This is
 * intentionally much smaller than the handle touch target: the recovery should
 * only catch rogue states where the crop is effectively unreachable, not valid
 * crops sitting near the canvas edge.
 */
const MIN_RECOVERABLE_VISIBLE_CROP_EDGE = 16;
/**
 * A crop edge also has to be mostly clipped before recovery runs. This keeps a
 * tiny but fully visible crop from being treated as invalid just because its
 * rendered size is below MIN_RECOVERABLE_VISIBLE_CROP_EDGE.
 */
const MIN_RECOVERABLE_VISIBLE_CROP_RATIO = 0.25;

/**
 * Detect whether a crop has become visually unreachable in the rendered
 * canvas. This is a UI reachability check, not a source-image containment
 * check: it includes view-scale and transient viewport pan in CSS pixels.
 *
 * @param cropRect      Crop rectangle in normalized image-footprint space.
 * @param canvasSize    Visible cropper canvas size in CSS pixels.
 * @param imageSize     Rendered image footprint size in CSS pixels.
 * @param viewportPan   Temporary cropper viewport pan in CSS pixels.
 * @param viewportPan.x Temporary horizontal viewport pan in CSS pixels.
 * @param viewportPan.y Temporary vertical viewport pan in CSS pixels.
 *
 * @return True when the crop is effectively unreachable in the visible canvas.
 */
export function isCropVisuallyUnreachable(
	cropRect: NormalizedRect,
	canvasSize: Size,
	imageSize: Size,
	viewportPan: { x: number; y: number }
): boolean {
	if (
		canvasSize.width <= 0 ||
		canvasSize.height <= 0 ||
		imageSize.width <= 0 ||
		imageSize.height <= 0 ||
		cropRect.width <= 0 ||
		cropRect.height <= 0
	) {
		return false;
	}

	const offsetX = ( canvasSize.width - imageSize.width ) / 2;
	const offsetY = ( canvasSize.height - imageSize.height ) / 2;
	const left = offsetX + viewportPan.x + cropRect.x * imageSize.width;
	const top = offsetY + viewportPan.y + cropRect.y * imageSize.height;
	const width = cropRect.width * imageSize.width;
	const height = cropRect.height * imageSize.height;
	const right = left + width;
	const bottom = top + height;
	const visibleWidth = Math.max(
		0,
		Math.min( canvasSize.width, right ) - Math.max( 0, left )
	);
	const visibleHeight = Math.max(
		0,
		Math.min( canvasSize.height, bottom ) - Math.max( 0, top )
	);

	const minimumVisibleWidth = Math.min(
		MIN_RECOVERABLE_VISIBLE_CROP_EDGE,
		width * MIN_RECOVERABLE_VISIBLE_CROP_RATIO
	);
	const minimumVisibleHeight = Math.min(
		MIN_RECOVERABLE_VISIBLE_CROP_EDGE,
		height * MIN_RECOVERABLE_VISIBLE_CROP_RATIO
	);

	return (
		visibleWidth < minimumVisibleWidth ||
		visibleHeight < minimumVisibleHeight
	);
}
