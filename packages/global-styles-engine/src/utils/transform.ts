// Mirror of `gutenberg_is_zero_rotation()` in PHP.
const ZERO_ANGLE_PATTERN = /^[+-]?(?:0+(?:\.0+)?|\.0+)(?:deg|grad|rad|turn)?$/i;

/**
 * Checks whether a rotation is a zero angle, such as `0`, `0deg` or `-0turn`,
 * which turns nothing.
 *
 * @param rotate Rotation value.
 * @return Whether the rotation is a zero angle.
 */
export function isZeroRotation( rotate: unknown ): boolean {
	return typeof rotate === 'string' && ZERO_ANGLE_PATTERN.test( rotate );
}
