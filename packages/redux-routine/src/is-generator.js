/* eslint-disable jsdoc/valid-types */
/**
 * Returns true if the given object is a generator, or false otherwise.
 *
 * @see https://www.ecma-international.org/ecma-262/6.0/#sec-generator-objects
 *
 * @param {any} object Object to test.
 *
 * @return {object is Generator} Whether object is a generator.
 */
export default function isGenerator( object ) {
	/* eslint-enable jsdoc/valid-types */
	// Check that iterator (next) and iterable (Symbol.iterator) interfaces are satisfied.
	// These checks seem to be compatible with several generator helpers as well as the native implementation.
	return (
		!! object &&
		typeof object[ Symbol.iterator ] === 'function' &&
		typeof object.next === 'function'
	);
}
