// TODO: Unit tests.

/**
 * Given an entity property value, returns the value in its raw form. A raw
 * value is the form of a value tracked as an edit for persistence.
 *
 * @param {*} value Entity property value.
 *
 * @return {*} Value in its raw form.
 */
function getRawValue( value ) {
	if (
		typeof value === 'object' &&
		value !== null &&
		value.hasOwnProperty( 'raw' )
	) {
		return value.raw;
	}

	return value;
}

export default getRawValue;
