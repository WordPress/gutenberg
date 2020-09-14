const SPACE_GRID_BASE = 8;

/**
 * Creates a spacing CSS value (px) based on grid system values.
 *
 * @param {number} value Multiplier against the grid base value (8)
 * @return {string} The spacing value (px).
 */
export function space( value = 1 ) {
	if ( isNaN( value ) ) return `${ SPACE_GRID_BASE }px`;

	return `${ SPACE_GRID_BASE * value }px`;
}
