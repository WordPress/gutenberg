/**
 * WordPress dependencies
 */
import { safeHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import type { ObjectData } from './types';

/**
 * Recursively sanitizes all string values in a plain object graph using
 * `safeHTML`, which strips `<script>` tags and `on*` event-handler attributes.
 * This prevents XSS attacks from malicious content injected by a remote RTC
 * collaborator into the shared CRDT document.
 *
 * Non-string primitives (numbers, booleans, null, undefined) pass through
 * unchanged. Arrays and plain objects are traversed recursively.
 *
 * @param {unknown} value The value to sanitize.
 * @return {unknown} The sanitized value.
 */
export function sanitizeValue( value: unknown ): unknown {
	if ( 'string' === typeof value ) {
		if ( 0 === value.length ) {
			return value;
		}

		return safeHTML( value );
	}

	if ( Array.isArray( value ) ) {
		return value.map( sanitizeValue );
	}

	// Recurse into plain objects
	if ( value && 'object' === typeof value && isPlainObject( value ) ) {
		return sanitizeObjectData( value as Record< string, unknown > );
	}

	return value;
}

/**
 * Returns true only for plain objects (object literals or
 * `Object.create( null )`). Used to skip recursion into other class instances.
 *
 * @param {Object} value The object to check.
 * @return {boolean} Whether the value is a plain object.
 */
function isPlainObject( value: object ): boolean {
	const proto = Object.getPrototypeOf( value );
	return proto === Object.prototype || proto === null;
}

/**
 * Sanitizes all string values in a record of changes from a CRDT document.
 *
 * @param {Record<string, unknown>} changes The changes object.
 * @return {Record<string, unknown>} A new object with all string values sanitized.
 */
export function sanitizeObjectData< T extends Record< string, unknown > >(
	changes: T
): T {
	const sanitized: Record< string, unknown > = {};
	for ( const [ key, val ] of Object.entries( changes ) ) {
		sanitized[ key ] = sanitizeValue( val );
	}
	return sanitized as T;
}

/**
 * Sanitizes a partial ObjectData record before it is written to the local
 * entity store. Intended to be called on the result of
 * `getChangesFromCRDTDoc` in `_updateEntityRecord`.
 *
 * @param {Partial<ObjectData>} changes Changes extracted from a remote CRDT update.
 * @return {Partial<ObjectData>} Sanitized changes.
 */
export function sanitizeRemoteChanges(
	changes: Partial< ObjectData >
): Partial< ObjectData > {
	return sanitizeObjectData( changes );
}
