/**
 * Insert one or multiple elements into a given position of an array.
 *
 * @param array    Source array.
 * @param elements Elements to insert.
 * @param index    Insert Position.
 *
 * @return Result.
 */
export function insertAt( array: any[], elements: any | any[], index: number ) {
	return [
		...array.slice( 0, index ),
		...( Array.isArray( elements ) ? elements : [ elements ] ),
		...array.slice( index ),
	];
}

/**
 * Moves an element in an array.
 *
 * @param array Source array.
 * @param from  Source index.
 * @param to    Destination index.
 * @param count Number of elements to move.
 *
 * @return Result.
 */
export function moveTo( array: any[], from: number, to: number, count = 1 ) {
	const withoutMovedElements = [ ...array ];
	withoutMovedElements.splice( from, count );
	return insertAt(
		withoutMovedElements,
		array.slice( from, from + count ),
		to
	);
}
