/**
 * A real number or something parsable as a number
 */
export type SpaceInput = number | string;

const GRID_BASE = '4px';

export function space( value?: SpaceInput ): string | undefined {
	if ( typeof value === 'undefined' ) {
		return undefined;
	}

	const asInt = typeof value === 'number' ? value : parseInt( value, 10 );

	if ( Number.isNaN( asInt ) ) {
		return value.toString();
	}

	return `calc(${ GRID_BASE } * ${ value })`;
}
