/**
 * A real number or something parsable as a number
 */
export type SpaceInput = number | string;

const GRID_BASE = '4px';

export function space( value?: SpaceInput ): string | undefined {
	if ( typeof value === 'undefined' ) {
		return undefined;
	}

	// handle empty strings, if it's the number 0 this still works
	if ( ! value ) {
		return '0';
	}

	// test if the input has a unit, in which case just use that value
	if (
		typeof CSS.supports === 'function' &&
		CSS.supports( 'margin', value.toString() )
	) {
		return value.toString();
	}

	// otherwise try to parse the value as a number if it's a string and then do the calculation
	const asInt = typeof value === 'number' ? value : Number( value );

	if ( Number.isNaN( asInt ) ) {
		return value.toString();
	}

	return `calc(${ GRID_BASE } * ${ value })`;
}
