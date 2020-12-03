/**
 * Quickly checks to see if two objects (shallow or deep) are equal.
 *
 * @param {any} objA
 * @param {any} objB
 *
 * @return {boolean} Whether the values are equal.
 */
export function simpleEqual( objA, objB ) {
	return JSON.stringify( objA ) === JSON.stringify( objB );
}
