export type AspectRatioShape = {
	x: number;
	y: number;
	width: number;
	height: number;
};

// The icon is drawn inside a 24px box, leaving a 4px margin on every side.
export const BOX_SIZE = 24;
const MAX_SIDE = 16;
// Keeps very wide or very tall ratios from collapsing into a line.
const MIN_RATIO = 1 / 3;
const MAX_RATIO = 3;

// The 1.5px line is centred on the rectangle's edges. A size ending in .5 puts
// those edges on .25 or .75, as in the generic icon, so the line covers whole
// pixels on a 2x display instead of being blurred across them.
function snapToPixels( size: number ) {
	return Math.ceil( size ) - 0.5;
}

/**
 * Returns the position and size, in the coordinates of the icon's 24px box, of
 * the rounded rectangle that represents an aspect ratio, or `null` when the
 * value is not a ratio that can be drawn.
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
	const width = snapToPixels( MAX_SIDE * Math.min( 1, clampedRatio ) );
	const height = snapToPixels( MAX_SIDE / Math.max( 1, clampedRatio ) );

	return {
		x: ( BOX_SIZE - width ) / 2,
		y: ( BOX_SIZE - height ) / 2,
		width,
		height,
	};
}
