import type { AspectRatioShape } from './types';

// The icon is drawn inside a 24px box. The generic aspect ratio icon spans
// 15.5px on its longest side, so the shapes drawn here match its size.
export const BOX_SIZE = 24;
const MAX_SIDE = 15.5;
// Keeps very wide or very tall ratios from collapsing into a line.
const MIN_RATIO = 1 / 3;
const MAX_RATIO = 3;

/**
 * Snaps the length of a side to a half pixel past a whole number, e.g. 8.5.
 * Centered in the box, the outline then sits a quarter pixel from the pixel
 * grid, like the strokes of the generic icon, so every shape has the same
 * crisp edges and none looks blurry.
 *
 * @param side Length of the side, in pixels.
 */
function snapSide( side: number ) {
	return Math.round( side - 0.5 ) + 0.5;
}

/**
 * Returns the shape that represents an aspect ratio, or `null` when the value
 * is not a ratio that can be drawn.
 *
 * @param ratio The aspect ratio, as width divided by height.
 */
export function getAspectRatioShape(
	ratio?: number | null
): AspectRatioShape | null {
	if ( ! ratio || ! Number.isFinite( ratio ) || ratio <= 0 ) {
		return null;
	}

	const clampedRatio = Math.min( MAX_RATIO, Math.max( MIN_RATIO, ratio ) );
	const width = snapSide(
		clampedRatio >= 1 ? MAX_SIDE : MAX_SIDE * clampedRatio
	);
	const height = snapSide(
		clampedRatio >= 1 ? MAX_SIDE / clampedRatio : MAX_SIDE
	);

	return {
		x: ( BOX_SIZE - width ) / 2,
		y: ( BOX_SIZE - height ) / 2,
		width,
		height,
	};
}
