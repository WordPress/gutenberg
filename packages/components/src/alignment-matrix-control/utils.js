export const GRID = [
	[ 'top left', 'top center', 'top right' ],
	[ 'center left', 'center center', 'center right' ],
	[ 'bottom left', 'bottom center', 'bottom right' ],
];

export const ALIGNMENTS = GRID.reduce( ( alignments, row ) => {
	row.forEach( ( cell ) => {
		alignments.push( cell );
	} );

	return alignments;
}, [] );

export function parseValue( value ) {
	const nextValue = value === 'center' ? 'center center' : value;

	return nextValue.replace( '-', ' ' );
}

export function getItemId( id, value ) {
	const valueId = parseValue( value ).replace( '-', ' ' );

	return `${ id }-${ valueId }`;
}

/**
 * Retrieves the [x, y] alignment data index from a value.
 *
 * @param {string} alignment Value to check.
 *
 * @return {number} The index of a matching alignment.
 */
export function getAlignmentIndex( alignment = 'center' ) {
	const item = parseValue( alignment ).replace( '-', ' ' );
	const index = ALIGNMENTS.indexOf( item );

	return index > -1 ? index : undefined;
}
