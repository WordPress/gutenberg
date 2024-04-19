/**
 * @typedef  {Object} WPPoint
 * @property {number} x The horizontal coordinate.
 * @property {number} y The vertical coordinate.
 */

/**
 * Clamps a value to a range. Uses the CSS `clamp()` ordering for arguments.
 *
 * @param {number} min   Minimum range.
 * @param {number} value Value to clamp.
 * @param {number} max   Maximum range.
 *
 * @return {number} Clamped value.
 */
function clamp( min, value, max ) {
	return Math.max( min, Math.min( value, max ) );
}

/**
 * Evaluates a linear function passing through two points at the given x value.
 *
 * Example:
 * f(x)
 *  │   ╲
 *  │    * (p0)
 *  │     ╲
 *  │      ╲
 *  │  (p1) *
 *  │        ╲
 *  └──────────── x
 *
 * @param {WPPoint} p0 First point.
 * @param {WPPoint} p1 Second point.
 * @param {number}  x  Value to evaluate at.
 *
 * @return {number} Result of the two-point linear function at x.
 */
function twoPointLinearFn( p0, p1, x ) {
	return ( ( p1.y - p0.y ) / ( p1.x - p0.x ) ) * ( x - p0.x ) + p0.y;
}

/**
 * Evaluates a two-point linear function at a given x value, clamped to the range of the points.
 *
 * Example:
 * f(x)
 *  │ ───* (p0)
 *  │     ╲
 *  │      ╲
 *  │  (p1) *───
 *  └──────────── x
 *
 * @param {WPPoint} p0 First point.
 * @param {WPPoint} p1 Second point.
 * @param {number}  x  Value to evaluate at.
 *
 * @return {number} Result of the two-point linear function clamped to the range of the points.
 */
function clampedTwoPointLinearFn( p0, p1, x ) {
	return clamp(
		Math.min( p0.y, p1.y ),
		twoPointLinearFn( p0, p1, x ),
		Math.max( p0.y, p1.y )
	);
}

/**
 * Computes the iframe scale using a start and end width/scale pair and the current width.
 *
 * The scale is clamped outside the points and is linearly interpolated between.
 *
 * Example:
 * scale
 *  │ ───* (start)
 *  │     ╲
 *  │      ╲
 *  │ (end) *───
 *  └──────────── width
 *
 * @param {Object} start        First width and scale pair.
 * @param {Object} end          Second width and scale pair.
 * @param {number} currentWidth Current width.
 *
 * @return {number} The scale of the current width between the two points.
 */
export function computeIFrameScale( start, end, currentWidth ) {
	return clampedTwoPointLinearFn(
		{ x: start.width, y: start.scale },
		{ x: end.width, y: end.scale },
		currentWidth
	);
}
