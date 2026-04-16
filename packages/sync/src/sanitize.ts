/**
 * External dependencies
 */
import DOMPurify, {
	type Config as DOMPurifyConfig,
	type UponSanitizeAttributeHook,
} from 'dompurify';

/**
 * Internal dependencies
 */
import type { KsesAllowedHtml, ObjectData } from './types';

const allowedHtml: KsesAllowedHtml = window._wpCollaborationKsesHtml ?? {};

const allowedTags = Object.keys( allowedHtml );
const allowedAttrs = Array.from(
	new Set(
		allowedTags.flatMap( ( tag ) => Object.keys( allowedHtml[ tag ] ) )
	)
);

// Enforce per-tag attribute filtering to match kses semantics. DOMPurify's
// `ALLOWED_ATTR` is a flat global set; kses scopes attributes to specific
// tags. Without this hook, an attribute allowed on one tag would be allowed
// on every tag.
const enforcePerTagAttributes: UponSanitizeAttributeHook = ( node, data ) => {
	if ( 0 === allowedTags.length ) {
		return;
	}

	const tag = node.nodeName.toLowerCase();
	const attr = data.attrName.toLowerCase();
	const tagAttrs = allowedHtml[ tag ];

	if ( ! tagAttrs || ! tagAttrs[ attr ] ) {
		data.keepAttr = false;
	}
};

DOMPurify.addHook( 'uponSanitizeAttribute', enforcePerTagAttributes );

// URI scheme filtering is left to DOMPurify's built-in `IS_ALLOWED_URI`
// pattern (blocks `javascript:`, `data:`, `vbscript:`, etc.) rather than a
// hand-rolled regex around `wp_allowed_protocols()`. Slightly stricter than
// kses (a few exotic schemes like `irc:`, `webcal:` are dropped), which is
// acceptable for a security-first sanitizer.
const sanitizeConfig: DOMPurifyConfig = {
	// FORCE_BODY ensures leading HTML comments are not stripped.
	// WordPress block markup relies on comment delimiters
	// (e.g. <!-- wp:paragraph -->) that may precede any element.
	FORCE_BODY: true,
	// Allow HTML comment nodes so block delimiters survive.
	ADD_TAGS: [ '#comment' ],
	...( allowedTags.length > 0 ? { ALLOWED_TAGS: allowedTags } : {} ),
	...( allowedAttrs.length > 0 ? { ALLOWED_ATTR: allowedAttrs } : {} ),
};

/**
 * Recursively sanitizes all string values in an object using DOMPurify
 * configured with the kses-post allowlist injected from PHP. This prevents
 * XSS attacks from malicious content injected by a remote RTC collaborator
 * into the shared CRDT document.
 *
 * Non-string primitives (numbers, booleans, null, undefined) are passed
 * through unchanged. Arrays and plain objects are traversed recursively.
 *
 * @param {unknown} value The value to sanitize.
 * @return {unknown} The sanitized value.
 */
export function sanitizeValue( value: unknown ): unknown {
	if ( 'string' === typeof value ) {
		if ( 0 === value.length ) {
			return value;
		}

		return DOMPurify.sanitize( value, sanitizeConfig );
	}

	if ( Array.isArray( value ) ) {
		return value.map( sanitizeValue );
	}

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
