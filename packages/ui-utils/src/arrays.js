function arrayMoveMutate( array, from, to ) {
	const startIndex = from < 0 ? array.length + from : from;

	if ( startIndex >= 0 && startIndex < array.length ) {
		const endIndex = to < 0 ? array.length + to : to;

		const [ item ] = array.splice( from, 1 );
		array.splice( endIndex, 0, item );
	}
}

/**
 * Moves an array item to a different position.
 *
 * See:
 * https://github.com/sindresorhus/array-move#readme
 *
 * @param {Array} array The array containing the items to move.
 * @param {number} from The source index.
 * @param {number} to The destination index.
 *
 * @return {Array} The updated array.
 */
export function arrayMove( array, from, to ) {
	array = [ ...array ];
	arrayMoveMutate( array, from, to );
	return array;
}

/**
 * Creates an array prefilled with an amount.
 *
 * @param {number} amount
 * @return {Array<number>} The filled array.
 */
export function arrayFill( amount = 0 ) {
	return Array.from( Array( amount ).keys() );
}
