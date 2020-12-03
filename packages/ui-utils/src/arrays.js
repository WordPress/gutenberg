/**
 * Moves an array item to a different position.
 *
 * See:
 * https://github.com/sindresorhus/array-move#readme
 */
export { default as arrayMove } from 'array-move';

/**
 * Creates an array prefilled with an amount.
 *
 * @param {number} amount
 * @return {Array<number>} The filled array.
 */
export function arrayFill( amount = 0 ) {
	return Array.from( Array( amount ).keys() );
}
