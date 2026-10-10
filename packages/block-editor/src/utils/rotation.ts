/**
 * Wraps an angle into the (-180, 180] range used to store rotation.
 *
 * @param angle Angle in degrees.
 *
 * @return The equivalent angle in (-180, 180].
 */
export function normalizeAngle( angle: number ): number {
	// Only add or remove a turn when needed, so that angles which are already
	// in range come back exactly as they are.
	let normalized = angle % 360;
	if ( normalized > 180 ) {
		normalized -= 360;
	} else if ( normalized <= -180 ) {
		normalized += 360;
	}
	// Avoid returning -0.
	return normalized || 0;
}

/**
 * Converts a stored rotation to the [0, 360) range used by `AnglePickerControl`.
 *
 * @param rotate Stored rotation in degrees.
 *
 * @return The angle in [0, 360).
 */
export function toPickerAngle( rotate: number | undefined ): number {
	return ( ( ( rotate ?? 0 ) % 360 ) + 360 ) % 360;
}

/**
 * Converts an `AnglePickerControl` value to a stored rotation.
 *
 * @param value Angle in degrees, in [0, 360].
 *
 * @return The rotation in (-180, 180].
 */
export function fromPickerAngle( value: number | string | undefined ): number {
	const angle = Number( value );
	return Number.isFinite( angle ) ? normalizeAngle( Math.round( angle ) ) : 0;
}
