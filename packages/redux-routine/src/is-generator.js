/**
 * Returns true if the given object is a generator, or false otherwise.
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is a generator.
 */
export default function isGenerator( object ) {
	return !! object && typeof object.next === 'function';
}
