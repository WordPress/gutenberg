const SPACE_GRID_BASE = 8;

export function space( value = 1 ) {
	if ( isNaN( value ) ) return `4px`;
	return `${ SPACE_GRID_BASE * value }px`;
}
