/**
 * External dependencies
 */
import { isPlainObject } from 'is-plain-object';
import type { Action } from 'redux';

/**
 * Returns true if the given object quacks like an action.
 *
 * @param object Object to test
 *
 * @return Whether object is an action.
 */
export function isAction( object: unknown ): object is Action {
	return isPlainObject( object ) && typeof object.type === 'string';
}

/**
 * Returns true if the given object quacks like an action and has a specific
 * action type
 *
 * @param object       Object to test
 * @param expectedType The expected type for the action.
 *
 * @return Whether object is an action and is of specific type.
 */
export function isActionOfType(
	object: unknown,
	expectedType: string
): object is Action {
	return isAction( object ) && object.type === expectedType;
}
