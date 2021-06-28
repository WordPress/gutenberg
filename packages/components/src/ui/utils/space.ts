/**
 * A real number or something parsable as a number
 */
export type SpaceInput = number | `${ number }`;

const GRID_BASE = '4px';

export function space( value?: SpaceInput ): string | undefined {
	if ( typeof value === 'undefined' ) {
		return undefined;
	}

	return `calc(${ GRID_BASE } * ${ value })`;
}
