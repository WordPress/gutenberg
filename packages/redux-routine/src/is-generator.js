/**
 * Returns true if the given object is an iterator, or false otherwise.
 *
 * @see https://www.ecma-international.org/ecma-262/6.0/#sec-%iteratorprototype%-object
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is a generator.
 */
export default function isGenerator( object ) {
	// Check for Symbol.iterator and next methods.
	// These checks seem to be compatible with several generator helpers as well as the native implementation.
	return (
		!! object &&
		typeof object[ Symbol.iterator ] === 'function' &&
		typeof object.next === 'function'
	);
}
