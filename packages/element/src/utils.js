/**
 * Checks if the provided WP element is empty.
 *
 * @param {*} element WP element to check.
 * @return {boolean} True when an element is considered empty.
 */
export const isEmptyElement = ( element ) => {
	if ( typeof element === 'number' ) {
		return false;
	}

	if ( typeof element?.valueOf() === 'string' || Array.isArray( element ) ) {
		return ! element.length;
	}

	return ! element;
};

/**
 * Checks if the provided value is a plain object.
 *
 * Plain objects are objects that are either:
 * - created by the `Object` constructor, or
 * - with a `[[Prototype]]` of `null`.
 *
 * @param {*} value Value to check.
 * @return {boolean} True when value is considered a plain object.
 */
export const isPlainObject = ( value ) => {
	if ( typeof value !== 'object' || value === null ) {
		return false;
	}

	if ( Object.getPrototypeOf( value ) === null ) {
		return true;
	}

	return (
		value.constructor === Object &&
		Object.prototype.toString.call( value ) === '[object Object]'
	);
};
