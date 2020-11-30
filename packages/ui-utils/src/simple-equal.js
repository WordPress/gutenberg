/**
 * @param {any} objA
 * @param {any} objB
 * @return {boolean}
 */
export function simpleEqual( objA, objB ) {
	return JSON.stringify( objA ) === JSON.stringify( objB );
}
