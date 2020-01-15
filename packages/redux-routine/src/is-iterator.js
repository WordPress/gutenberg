/**
 * Returns true if the given object is an iterator, or false otherwise.
 *
 * @see https://www.ecma-international.org/ecma-262/6.0/#sec-%iteratorprototype%-object
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is an iterator.
 */
export default function isIterator( object ) {
	return !! object && typeof object[ Symbol.iterator ] === 'function';
}
