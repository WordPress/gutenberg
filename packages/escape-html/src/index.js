/**
 * Regular expression matching invalid attribute names.
 *
 * "Attribute names must consist of one or more characters other than controls,
 * U+0020 SPACE, U+0022 ("), U+0027 ('), U+003E (>), U+002F (/), U+003D (=),
 * and noncharacters."
 *
 * @link https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
 *
 * @type {RegExp}
 */
const REGEXP_INVALID_ATTRIBUTE_NAME = /[\u007F-\u009F "'>/="\uFDD0-\uFDEF]/;

/**
 * Returns a string with ampersands escaped. Note that this is an imperfect
 * implementation, where only ampersands which do not appear as a pattern of
 * named, decimal, or hexadecimal character references are escaped. Invalid
 * named references (i.e. ambiguous ampersand) are are still permitted.
 *
 * @link https://w3c.github.io/html/syntax.html#character-references
 * @link https://w3c.github.io/html/syntax.html#ambiguous-ampersand
 * @link https://w3c.github.io/html/syntax.html#named-character-references
 *
 * @param {string} value Original string.
 *
 * @return {string} Escaped string.
 */
export function escapeAmpersand( value ) {
	return value.replace( /&(?!([a-z0-9]+|#[0-9]+|#x[a-f0-9]+);)/gi, '&amp;' );
}

/**
 * Returns a string with quotation marks replaced.
 *
 * @param {string} value Original string.
 *
 * @return {string} Escaped string.
 */
export function escapeQuotationMark( value ) {
	return value.replace( /"/g, '&quot;' );
}

/**
 * Returns a string with less-than sign replaced.
 *
 * @param {string} value Original string.
 *
 * @return {string} Escaped string.
 */
export function escapeLessThan( value ) {
	return value.replace( /</g, '&lt;' );
}

/**
 * Returns an escaped attribute value.
 *
 * @link https://w3c.github.io/html/syntax.html#elements-attributes
 *
 * "[...] the text cannot contain an ambiguous ampersand [...] must not contain
 * any literal U+0022 QUOTATION MARK characters (")"
 *
 * @param {string} value Attribute value.
 *
 * @return {string} Escaped attribute value.
 */
export function escapeAttribute( value ) {
	return escapeQuotationMark( escapeAmpersand( value ) );
}

/**
 * Returns an escaped HTML element value.
 *
 * @link https://w3c.github.io/html/syntax.html#writing-html-documents-elements
 *
 * "the text must not contain the character U+003C LESS-THAN SIGN (<) or an
 * ambiguous ampersand."
 *
 * @param {string} value Element value.
 *
 * @return {string} Escaped HTML element value.
 */
export function escapeHTML( value ) {
	return escapeLessThan( escapeAmpersand( value ) );
}

/**
 * Returns true if the given attribute name is valid, or false otherwise.
 *
 * @param {string} name Attribute name to test.
 *
 * @return {boolean} Whether attribute is valid.
 */
export function isValidAttributeName( name ) {
	return ! REGEXP_INVALID_ATTRIBUTE_NAME.test( name );
}
