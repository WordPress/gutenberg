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
	// Check for presence of Symbol.iterator and next method.
	// These checks seem to be widely compatible with generator helpers as well as the native implementation.
	return !! object && Symbol.iterator in object && typeof object.next === 'function';
}
