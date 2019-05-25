/**
 * Returns true if the given object is a generator, or false otherwise.
 *
 * @see https://www.ecma-international.org/ecma-262/6.0/#sec-generator-objects
 *
 * @param {*} object Object to test.
 *
 * @return {boolean} Whether object is a generator.
 */
export default function isGenerator( object ) {
	return (
		!! object &&
		object[ Symbol.toStringTag ] === 'Generator'
	);
}
