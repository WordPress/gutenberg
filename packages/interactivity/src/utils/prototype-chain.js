/**
 * Checks whether a property key leads out of an object's own data:
 * `__proto__` to its prototype, `constructor` to its constructor, and
 * `prototype` to a function's prototype.
 *
 * @param {unknown} key The property key.
 * @return {boolean} Whether the key is reserved.
 */
export const isReservedKey = ( key ) =>
	key === '__proto__' || key === 'constructor' || key === 'prototype';

/**
 * `JSON.parse()` reviver that removes keys named `__proto__`.
 *
 * `JSON.parse()` creates `__proto__` as an own property. Copying it by
 * assignment, as in a `for...in` loop or `Object.assign()`, replaces the
 * target's prototype instead.
 *
 * @param {string}  key   The property key.
 * @param {unknown} value The parsed value.
 * @return {unknown} The value, or `undefined` to remove the key.
 */
export const jsonReviver = ( key, value ) =>
	key === '__proto__' ? undefined : value;

/**
 * Reads a property that an object owns, ignoring inherited properties such
 * as `Object.prototype.valueOf`.
 *
 * @param {Object} object The object to read.
 * @param {string} key    The property key.
 * @return {any} The value, or `undefined` if the object doesn't own the property.
 */
export const getOwnProperty = ( object, key ) =>
	Object.prototype.hasOwnProperty.call( object, key )
		? object[ key ]
		: undefined;
