export const FULL_TURN = 360;

export function clamp( value: number, min: number, max: number ) {
	return Math.min( Math.max( value, min ), max );
}

/**
 * Returns `angle` within one turn, from 0 up to but not including 360.
 *
 * @param angle An angle in degrees.
 */
export function wrapAngle( angle: number ) {
	return ( ( angle % FULL_TURN ) + FULL_TURN ) % FULL_TURN;
}

/**
 * Rounds `value` to the nearest multiple of `step` counted from `origin`,
 * without the floating point noise of a fractional step.
 *
 * @param value  The value to round.
 * @param step   The step size.
 * @param origin The value that steps are counted from.
 */
export function roundToStep( value: number, step: number, origin: number ) {
	const rounded = Math.round( ( value - origin ) / step ) * step + origin;
	const precision = String( step ).split( '.' )[ 1 ]?.length ?? 0;
	return Number( rounded.toFixed( precision ) );
}

/**
 * Returns the angle of a point around the center of `rect`, clockwise from
 * the top, from 0 up to but not including 360.
 *
 * @param rect    The bounds of the dial.
 * @param clientX The horizontal position of the point.
 * @param clientY The vertical position of the point.
 */
export function getPointerAngle(
	rect: DOMRect,
	clientX: number,
	clientY: number
) {
	const x = clientX - ( rect.left + rect.width / 2 );
	const y = clientY - ( rect.top + rect.height / 2 );
	return wrapAngle( ( Math.atan2( y, x ) * 180 ) / Math.PI + 90 );
}

/**
 * Returns the angle that points the same way as `angle` and is closest to
 * `reference`.
 *
 * @param angle     An angle in degrees.
 * @param reference The angle in degrees to stay close to.
 */
export function getNearestEquivalent( angle: number, reference: number ) {
	return angle + FULL_TURN * Math.round( ( reference - angle ) / FULL_TURN );
}

/**
 * Returns the turn in degrees from `from` to `to` the short way round, with
 * a half turn going clockwise.
 *
 * @param from The starting angle in degrees.
 * @param to   The ending angle in degrees.
 */
export function getShortestTurn( from: number, to: number ) {
	const delta = to - from;
	return delta + FULL_TURN * Math.round( -delta / FULL_TURN );
}
