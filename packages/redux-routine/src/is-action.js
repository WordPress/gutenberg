/**
 * External dependencies
 */
import { isPlainObject } from 'is-plain-object';

/* eslint-disable jsdoc/valid-types */
/**
 * Returns true if the given object quacks like an action.
 *
 * @param {any} object Object to test
 *
 * @return {object is import('redux').AnyAction}  Whether object is an action.
 */
export function isAction( object ) {
	return isPlainObject( object ) && typeof object.type === 'string';
}

/**
 * Returns true if the given object quacks like an action and has a specific
 * action type
 *
 * @param {unknown} object       Object to test
 * @param {string}  expectedType The expected type for the action.
 *
 * @return {object is import('redux').AnyAction} Whether object is an action and is of specific type.
 */
export function isActionOfType( object, expectedType ) {
	/* eslint-enable jsdoc/valid-types */
	return isAction( object ) && object.type === expectedType;
}
