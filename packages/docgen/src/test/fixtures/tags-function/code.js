/**
 * Registers a standard `@wordpress/data` store.
 *
 * @deprecated since 5.6. Callers should use the `receiveAutosaves( postId, autosave )`
 * 			   selector from the '@wordpress/core-data' package.
 * @since 2.0.0
 *
 * @see addition
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators
 *
 * @param {number} firstParam The first param to add.
 * @param {number} secondParam The second param to add.
 *
 *  @example
 *
 * ```js
 * const x = require('@wordpress/test');
 *
 * const addResult = sum( 1, 3 );
 * console.log( addResult ); // will yield 4
 * ```
 *
 * @return {number} The result of adding the two params.
 */
export const sum = ( firstParam, secondParam ) => {
	return firstParam + secondParam;
};
