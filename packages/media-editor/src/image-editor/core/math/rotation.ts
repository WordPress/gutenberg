/**
 * Normalizes a rotation value to the range [0, 360).
 *
 * Negative rotations are converted to their positive clockwise equivalent.
 * For example, -90 becomes 270, -45 becomes 315, and 450 becomes 90.
 *
 * @param degrees The rotation value in degrees.
 * @return The normalized rotation in the range [0, 360).
 */
export function normalizeRotation( degrees: number ): number {
	if ( degrees >= 0 ) {
		return degrees % 360;
	}
	// For negative rotations, convert to positive clockwise equivalent.
	return ( 360 + ( degrees % 360 ) ) % 360;
}

/**
 * Converts an angle from degrees to radians.
 *
 * @param degrees The angle in degrees.
 * @return The angle in radians.
 */
export function degreesToRadians( degrees: number ): number {
	return ( degrees * Math.PI ) / 180;
}
