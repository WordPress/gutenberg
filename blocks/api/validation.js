/**
 * External dependencies
 */
import { tokenize } from 'simple-html-tokenizer';
import { xor, fromPairs, isEqual, includes } from 'lodash';

/**
 * Internal dependencies
 */
import { getSaveContent } from './serializer';

/**
 * Globally matches any consecutive whitespace
 *
 * @type {RegExp}
 */
const REGEXP_WHITESPACE = /[\t\n\r\v\f ]+/g;

/**
 * Matches a string containing only whitespace
 *
 * @type {RegExp}
 */
const REGEXP_ONLY_WHITESPACE = /^[\t\n\r\v\f ]*$/;

/**
 * Matches a CSS URL type value
 *
 * @type {RegExp}
 */
const REGEXP_STYLE_URL_TYPE = /^url\s*\(['"\s]*(.*?)['"\s]*\)$/;

/**
 * Boolean attributes are attributes whose presence as being assigned is
 * meaningful, even if only empty.
 *
 * See: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes
 * Extracted from: https://html.spec.whatwg.org/multipage/indices.html#attributes-3
 *
 * [ ...document.querySelectorAll( '#attributes-1 > tbody > tr' ) ]
 *     .filter( ( tr ) => tr.lastChild.textContent.indexOf( 'Boolean attribute' ) !== -1 )
 *     .map( ( tr ) => tr.firstChild.textContent.trim() )
 *
 * @type {Array}
 */
const BOOLEAN_ATTRIBUTES = [
	'allowfullscreen',
	'allowpaymentrequest',
	'allowusermedia',
	'async',
	'autofocus',
	'autoplay',
	'checked',
	'controls',
	'default',
	'defer',
	'disabled',
	'formnovalidate',
	'hidden',
	'ismap',
	'itemscope',
	'loop',
	'multiple',
	'muted',
	'nomodule',
	'novalidate',
	'open',
	'open',
	'playsinline',
	'readonly',
	'required',
	'reversed',
	'selected',
	'typemustmatch',
];

/**
 * Enumerated attributes are attributes which must be of a specific value form.
 * Like boolean attributes, these are meaningful if specified, even if not of a
 * valid enumerated value.
 *
 * See: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#enumerated-attribute
 * Extracted from: https://html.spec.whatwg.org/multipage/indices.html#attributes-3
 *
 * [ ...document.querySelectorAll( '#attributes-1 > tbody > tr' ) ]
 *     filter( ( tr ) => /("(.+?)";?\s*)+/.test( tr.lastChild.textContent ) )
 *     .map( ( tr ) => tr.firstChild.textContent.trim() )
 *
 * @type {Array}
 */
const ENUMERATED_ATTRIBUTES = [
	'autocomplete',
	'contenteditable',
	'crossorigin',
	'dir',
	'dir',
	'draggable',
	'enctype',
	'formenctype',
	'formmethod',
	'inputmode',
	'kind',
	'method',
	'preload',
	'sandbox',
	'scope',
	'shape',
	'spellcheck',
	'step',
	'translate',
	'type',
	'type',
	'workertype',
	'wrap',
];

/**
 * Meaningful attributes are those who cannot be safely ignored when omitted in
 * one HTML markup string and not another.
 *
 * @type {Array}
 */
const MEANINGFUL_ATTRIBUTES = [
	...BOOLEAN_ATTRIBUTES,
	...ENUMERATED_ATTRIBUTES,
];

/**
 * Given a specified string, returns an array of strings split by consecutive
 * whitespace, ignoring leading or trailing whitespace.
 *
 * @param  {String}   text Original text
 * @return {String[]}      Text pieces split on whitespace
 */
export function getTextPiecesSplitOnWhitespace( text ) {
	return text.trim().split( REGEXP_WHITESPACE );
}

/**
 * Given a specified string, returns a new trimmed string where all consecutive
 * whitespace is collapsed to a single space.
 *
 * @param  {String} text Original text
 * @return {String}      Trimmed text with consecutive whitespace collapsed
 */
export function getTextWithCollapsedWhitespace( text ) {
	return getTextPiecesSplitOnWhitespace( text ).join( ' ' );
}

/**
 * Returns attribute pairs of the given StartTag token, including only pairs
 * where the value is non-empty or the attribute is a boolean attribute, an
 * enumerated attribute, or a custom data- attribute.
 *
 * @see MEANINGFUL_ATTRIBUTES
 *
 * @param  {Object}  token StartTag token
 * @return {Array[]}       Attribute pairs
 */
export function getMeaningfulAttributePairs( token ) {
	return token.attributes.filter( ( pair ) => {
		const [ key, value ] = pair;
		return (
			value ||
			key.indexOf( 'data-' ) === 0 ||
			includes( MEANINGFUL_ATTRIBUTES, key )
		);
	} );
}

/**
 * Returns true if two text tokens (with `chars` property) are equivalent, or
 * false otherwise.
 *
 * @param  {Object}  a First token
 * @param  {Object}  b Second token
 * @return {Boolean}   Whether two text tokens are equivalent
 */
export function isEqualTextTokensWithCollapsedWhitespace( a, b ) {
	// This is an overly simplified whitespace comparison. The specification is
	// more prescriptive of whitespace behavior in inline and block contexts.
	//
	// See: https://medium.com/@patrickbrosset/when-does-white-space-matter-in-html-b90e8a7cdd33
	return isEqual( ...[ a.chars, b.chars ].map( getTextWithCollapsedWhitespace ) );
}

/**
 * Given a style value, returns a normalized style value for strict equality
 * comparison.
 *
 * @param  {String} value Style value
 * @return {String}       Normalized style value
 */
export function getNormalizedStyleValue( value ) {
	return value
		// Normalize URL type to omit whitespace or quotes
		.replace( REGEXP_STYLE_URL_TYPE, 'url($1)' );
}

/**
 * Given a style attribute string, returns an object of style properties.
 *
 * @param  {String} text Style attribute
 * @return {Object}      Style properties
 */
export function getStyleProperties( text ) {
	const pairs = text
		// Trim ending semicolon (avoid including in split)
		.replace( /;?\s*$/, '' )
		// Split on property assignment
		.split( ';' )
		// For each property assignment...
		.map( ( style ) => {
			// ...split further into key-value pairs
			const [ key, ...valueParts ] = style.split( ':' );
			const value = valueParts.join( ':' );

			return [
				key.trim(),
				getNormalizedStyleValue( value.trim() ),
			];
		} );

	return fromPairs( pairs );
}

/**
 * Attribute-specific equality handlers
 *
 * @type {Object}
 */
export const isEqualAttributesOfName = {
	class: ( a, b ) => {
		// Class matches if members are the same, even if out of order or
		// superfluous whitespace between.
		return ! xor( ...[ a, b ].map( getTextPiecesSplitOnWhitespace ) ).length;
	},
	style: ( a, b ) => {
		return isEqual( ...[ a, b ].map( getStyleProperties ) );
	},
};

/**
 * Given two sets of attribute tuples, returns true if the attribute sets are
 * equivalent
 *
 * @param  {Array[]} a First attributes tuples
 * @param  {Array[]} b Second attributes tuples
 * @return {Boolean}   Whether attributes are equivalent
 */
export function isEqualTagAttributePairs( a, b ) {
	// Attributes is tokenized as tuples. Their lengths should match. This also
	// avoids us needing to check both attributes sets, since if A has any keys
	// which do not exist in B, we know the sets to be different.
	if ( a.length !== b.length ) {
		return false;
	}

	// Convert tuples to object for ease of lookup
	const [ aAttributes, bAttributes ] = [ a, b ].map( fromPairs );

	for ( const name in aAttributes ) {
		// As noted above, if missing member in B, assume different
		if ( ! bAttributes.hasOwnProperty( name ) ) {
			return false;
		}

		const aValue = aAttributes[ name ];
		const bValue = bAttributes[ name ];

		const isEqualAttributes = isEqualAttributesOfName[ name ];
		if ( isEqualAttributes ) {
			// Defer custom attribute equality handling
			if ( ! isEqualAttributes( aValue, bValue ) ) {
				return false;
			}
		} else if ( aValue !== bValue ) {
			// Otherwise strict inequality should bail
			return false;
		}
	}

	return true;
}

/**
 * Token-type-specific equality handlers
 *
 * @type {Object}
 */
export const isEqualTokensOfType = {
	StartTag: ( a, b ) => {
		if ( a.tagName !== b.tagName ) {
			return false;
		}

		return isEqualTagAttributePairs(
			...[ a, b ].map( getMeaningfulAttributePairs )
		);
	},
	Chars: isEqualTextTokensWithCollapsedWhitespace,
	Comment: isEqualTextTokensWithCollapsedWhitespace,
};

/**
 * Given an array of tokens, returns the first token which is not purely
 * whitespace.
 *
 * Mutates the tokens array.
 *
 * @param  {Object[]} tokens Set of tokens to search
 * @return {Object}          Next non-whitespace token
 */
export function getNextNonWhitespaceToken( tokens ) {
	let token;
	while ( ( token = tokens.shift() ) ) {
		if ( token.type !== 'Chars' ) {
			return token;
		}

		if ( ! REGEXP_ONLY_WHITESPACE.test( token.chars ) ) {
			return token;
		}
	}
}

/**
 * Returns true if there is given HTML strings are effectively equivalent, or
 * false otherwise.
 *
 * @param  {String}  a First HTML string
 * @param  {String}  b Second HTML string
 * @return {Boolean}   Whether HTML strings are equivalent
 */
export function isEquivalentHTML( a, b ) {
	// Tokenize input content and reserialized save content
	const [ actualTokens, expectedTokens ] = [ a, b ].map( tokenize );

	let actualToken, expectedToken;
	while ( ( actualToken = getNextNonWhitespaceToken( actualTokens ) ) ) {
		expectedToken = getNextNonWhitespaceToken( expectedTokens );

		// Inequal if exhausted all expected tokens
		if ( ! expectedToken ) {
			return false;
		}

		// Inequal if next non-whitespace token of each set are not same type
		if ( actualToken.type !== expectedToken.type ) {
			return false;
		}

		// Defer custom token type equality handling, otherwise continue and
		// assume as equal
		const isEqualTokens = isEqualTokensOfType[ actualToken.type ];
		if ( isEqualTokens && ! isEqualTokens( actualToken, expectedToken ) ) {
			return false;
		}
	}

	while ( ( expectedToken = getNextNonWhitespaceToken( expectedTokens ) ) ) {
		// If any non-whitespace tokens remain in expected token set, this
		// indicates inequality
		return false;
	}

	return true;
}

/**
 * Returns true if the parsed block is valid given the input content. A block
 * is considered valid if, when serialized with assumed attributes, the content
 * matches the original value.
 *
 * Logs to console in development environments when invalid.
 *
 * @param  {String}  rawContent Original block content
 * @param  {String}  blockType  Block type
 * @param  {Object}  attributes Parsed block attributes
 * @return {Boolean}            Whether block is valid
 */
export function isValidBlock( rawContent, blockType, attributes ) {
	let saveContent;
	try {
		saveContent = getSaveContent( blockType, attributes );
	} catch ( error ) {
		return false;
	}

	return isEquivalentHTML( rawContent, saveContent );
}
