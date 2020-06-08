const SPACE_GRID_BASE = 8;

/**
 * Retrieves a value (px) form the grid system based on a multiplier value.
 *
 * @param {number} value Multiplier for the grid base value.
 *
 * @return {string} Grid space value (px).
 */
export function space( value = 1 ) {
	if ( isNaN( value ) ) return `4px`;

	return `${ SPACE_GRID_BASE * value }px`;
}
