/**
 * External dependencies
 */
import { isPlainObject, isString } from 'lodash';

/**
 * Returns true if the given object quacks like an action.
 *
 * @param {*} object Object to test
 *
 * @return {boolean}  Whether object is an action.
 */
export function isAction( object ) {
	return isPlainObject( object ) && isString( object.type );
}

/**
 * Returns true if the given object quacks like an action and has a specific
 * action type
 *
 * @param {*}      object       Object to test
 * @param {string} expectedType The expected type for the action.
 *
 * @return {boolean} Whether object is an action and is of specific type.
 */
export function isActionOfType( object, expectedType ) {
	return isAction( object ) && object.type === expectedType;
}
