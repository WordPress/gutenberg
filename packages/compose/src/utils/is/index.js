/**
 * External dependencies
 */
import _ from 'lodash';

const {
	isArray,
	isBoolean,
	isDate,
	isEmpty,
	isFunction,
	isMap,
	isNaN,
	isNil,
	isNull,
	isNumber,
	isObject,
	isObjectLike,
	isPlainObject,
	isRegExp,
	isSet,
	isString,
	isSymbol,
	isUndefined,
	isWeakMap,
	isWeakSet,
} = _;

/**
 * Checks to see if a value is a numeric value (`number` or `string`).
 *
 * @param {any} o
 *
 * @return {boolean} Whether value is numeric.
 */
const numeric = ( o ) => {
	const obj = typeof o === 'string' ? o.replace( /,/g, '' ) : o;
	return (
		! isNaN( parseFloat( obj ) ) &&
		! isNaN( Number( obj ) ) &&
		isFinite( obj ) &&
		Object.prototype.toString.call( obj ).toLowerCase() !== '[object array]'
	);
};

/**
 * Checks to see if a value is either `0` or `'0'`.
 *
 * @param {any} o
 *
 * @return {boolean} Whether value is a numeric `0`.
 */
const numericZero = ( o ) => {
	return o === 0 || o === '0';
};

/* eslint-disable jsdoc/valid-types */
/**
 * Checks to see if a value is not undefined and not null.
 *
 * @template T
 * @param {T} o
 *
 * @return {o is Exclude<T, undefined | null>} Whether value is defined.
 */
const defined = ( o ) => ! isNil( o );

/**
 * Checks if a value is empty, null, or undefined.
 *
 * @param {any} value The value to check.
 *
 * @return {boolean} Whether value is empty.
 */
function valueEmpty( value ) {
	const isEmptyString = value === '';
	return ! is.defined( value ) || isEmptyString;
}

/**
 * A collection of (mostly) strongly typed type checks.
 */
export const is = {
	/** @type {(o: any) => o is Blob} */
	blob: ( o ) => o instanceof window.Blob,
	defined,
	/** @type {(o: any) => o is File} */
	file: ( o ) => o instanceof window.$forFile,
	numeric,
	numericZero,
	valueEmpty,

	// This is safe because we only accept Interpolation rather than any
	// _.isPlainObject(TemplateStringsArray) -> false
	// _.isPlainObject is also `false` for the rest of the values that `Interpolation` covers except for `ObjectInterpolation` :)
	/** @type {(o: TemplateStringsArray | import('create-emotion').Interpolation) => o is import('create-emotion').ObjectInterpolation} */
	objectInterpolation: ( o ) => isPlainObject( o ),
	/* eslint-enable jsdoc/valid-types */

	/**
	 * Re-exports from lodash
	 */
	array: isArray,
	boolean: isBoolean,
	date: isDate,
	empty: isEmpty,
	function: isFunction,
	map: isMap,
	nan: isNaN,
	nil: isNil,
	number: isNumber,
	null: isNull,
	object: isObject,
	objectLike: isObjectLike,
	plainObject: isPlainObject,
	regExp: isRegExp,
	set: isSet,
	string: isString,
	symbol: isSymbol,
	undefined: isUndefined,
	weakSet: isWeakSet,
	weakMap: isWeakMap,
};

export default is;
