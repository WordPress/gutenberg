/**
 * Convert a horizontal pointer delta (px) into a value delta.
 *
 * Negative because dragging the ruler to the right should expose
 * smaller values to the left of the fixed center pointer (and vice
 * versa) — the ruler scrubs *under* the pointer.
 *
 * @param deltaPx       Pointer movement in CSS pixels.
 * @param pixelsPerStep CSS pixels of pointer travel per `step`.
 * @param step          Value units per step.
 */
export function pxToValueDelta(
	deltaPx: number,
	pixelsPerStep: number,
	step: number
): number {
	return ( -deltaPx / pixelsPerStep ) * step;
}

/**
 * Clamp `value` to the inclusive `[min, max]` interval.
 *
 * @param value Value to clamp.
 * @param min   Lower bound (inclusive).
 * @param max   Upper bound (inclusive).
 */
export function clampValue( value: number, min: number, max: number ): number {
	if ( value < min ) {
		return min;
	}
	if ( value > max ) {
		return max;
	}
	return value;
}

/**
 * Snap `next` to 0 only when entering the snap window from outside.
 *
 * Avoids a "sticky zero" while scrubbing through 0; the user gets a
 * single satisfying snap on entry, then is free to leave.
 *
 * @param next       Computed next value.
 * @param previous   Previous value (last emitted).
 * @param windowSize Half-width of the snap window in value units. 0
 *                   disables snapping.
 */
export function applyZeroSnap(
	next: number,
	previous: number,
	windowSize: number
): number {
	if ( windowSize <= 0 ) {
		return next;
	}
	const enteringWindow =
		Math.abs( next ) < windowSize && Math.abs( previous ) >= windowSize;
	return enteringWindow ? 0 : next;
}
