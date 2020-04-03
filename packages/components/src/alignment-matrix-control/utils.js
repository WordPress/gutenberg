export const GRID = [
	[ 'top left', 'top center', 'top right' ],
	[ 'center left', 'center center', 'center right' ],
	[ 'bottom left', 'bottom center', 'bottom right' ],
];

// Transforms GRID into a flat Array of values
export const ALIGNMENTS = GRID.reduce( ( alignments, row ) => {
	row.forEach( ( cell ) => {
		alignments.push( cell );
	} );

	return alignments;
}, [] );

/**
 * Parses and transforms an incoming value to better match the alignment values
 *
 * @param {string} value An alignment value to parse.
 *
 * @return {string} The parsed value.
 */
export function parseValue( value ) {
	const nextValue = value === 'center' ? 'center center' : value;

	return nextValue.replace( '-', ' ' );
}

/**
 * Creates an item ID based on a prefix ID and an alignment value.
 *
 * @param {string} prefixId An ID to prefix.
 * @param {string} value An alignment value.
 *
 * @return {string} The item id.
 */
export function getItemId( prefixId, value ) {
	const valueId = parseValue( value ).replace( '-', ' ' );

	return `${ prefixId }-${ valueId }`;
}

/**
 * Retrieves the alignment index from a value.
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
