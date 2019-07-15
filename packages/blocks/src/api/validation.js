/**
 * External dependencies
 */
import { Tokenizer } from 'simple-html-tokenizer';
import {
	identity,
	xor,
	fromPairs,
	isEqual,
	includes,
	stubTrue,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { getSaveContent } from './serializer';
import { normalizeBlockType } from './utils';

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
 * Object.keys( [ ...document.querySelectorAll( '#attributes-1 > tbody > tr' ) ]
 *     .filter( ( tr ) => tr.lastChild.textContent.indexOf( 'Boolean attribute' ) !== -1 )
 *     .reduce( ( result, tr ) => Object.assign( result, {
 *         [ tr.firstChild.textContent.trim() ]: true
 *     } ), {} ) ).sort();
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
	'download',
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
 * Object.keys( [ ...document.querySelectorAll( '#attributes-1 > tbody > tr' ) ]
 *     .filter( ( tr ) => /^("(.+?)";?\s*)+/.test( tr.lastChild.textContent.trim() ) )
 *     .reduce( ( result, tr ) => Object.assign( result, {
 *         [ tr.firstChild.textContent.trim() ]: true
 *     } ), {} ) ).sort();
 *
 * @type {Array}
 */
const ENUMERATED_ATTRIBUTES = [
	'autocapitalize',
	'autocomplete',
	'charset',
	'contenteditable',
	'crossorigin',
	'decoding',
	'dir',
	'draggable',
	'enctype',
	'formenctype',
	'formmethod',
	'http-equiv',
	'inputmode',
	'kind',
	'method',
	'preload',
	'scope',
	'shape',
	'spellcheck',
	'translate',
	'type',
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
 * Array of functions which receive a text string on which to apply normalizing
 * behavior for consideration in text token equivalence, carefully ordered from
 * least-to-most expensive operations.
 *
 * @type {Array}
 */
const TEXT_NORMALIZATIONS = [
	identity,
	getTextWithCollapsedWhitespace,
];

/**
 * Regular expression matching a named character reference. In lieu of bundling
 * a full set of references, the pattern covers the minimal necessary to test
 * positively against the full set.
 *
 * "The ampersand must be followed by one of the names given in the named
 * character references section, using the same case."
 *
 * Tested aginst "12.5 Named character references":
 *
 * ```
 * const references = [ ...document.querySelectorAll(
 *     '#named-character-references-table tr[id^=entity-] td:first-child'
 * ) ].map( ( code ) => code.textContent )
 * references.every( ( reference ) => /^[\da-z]+$/i.test( reference ) )
 * ```
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#character-references
 * @see https://html.spec.whatwg.org/multipage/named-characters.html#named-character-references
 *
 * @type {RegExp}
 */
const REGEXP_NAMED_CHARACTER_REFERENCE = /^[\da-z]+$/i;

/**
 * Regular expression matching a decimal character reference.
 *
 * "The ampersand must be followed by a U+0023 NUMBER SIGN character (#),
 * followed by one or more ASCII digits, representing a base-ten integer"
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#character-references
 *
 * @type {RegExp}
 */
const REGEXP_DECIMAL_CHARACTER_REFERENCE = /^#\d+$/;

/**
 * Regular expression matching a hexadecimal character reference.
 *
 * "The ampersand must be followed by a U+0023 NUMBER SIGN character (#), which
 * must be followed by either a U+0078 LATIN SMALL LETTER X character (x) or a
 * U+0058 LATIN CAPITAL LETTER X character (X), which must then be followed by
 * one or more ASCII hex digits, representing a hexadecimal integer"
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#character-references
 *
 * @type {RegExp}
 */
const REGEXP_HEXADECIMAL_CHARACTER_REFERENCE = /^#x[\da-f]+$/i;

/**
 * Returns true if the given string is a valid character reference segment, or
 * false otherwise. The text should be stripped of `&` and `;` demarcations.
 *
 * @param {string} text Text to test.
 *
 * @return {boolean} Whether text is valid character reference.
 */
export function isValidCharacterReference( text ) {
	return (
		REGEXP_NAMED_CHARACTER_REFERENCE.test( text ) ||
		REGEXP_DECIMAL_CHARACTER_REFERENCE.test( text ) ||
		REGEXP_HEXADECIMAL_CHARACTER_REFERENCE.test( text )
	);
}

/**
 * Subsitute EntityParser class for `simple-html-tokenizer` which uses the
 * implementation of `decodeEntities` from `html-entities`, in order to avoid
 * bundling a massive named character reference.
 *
 * @see https://github.com/tildeio/simple-html-tokenizer/tree/master/src/entity-parser.ts
 */
export class DecodeEntityParser {
	/**
	 * Returns a substitute string for an entity string sequence between `&`
	 * and `;`, or undefined if no substitution should occur.
	 *
	 * @param {string} entity Entity fragment discovered in HTML.
	 *
	 * @return {?string} Entity substitute value.
	 */
	parse( entity ) {
		if ( isValidCharacterReference( entity ) ) {
			return decodeEntities( '&' + entity + ';' );
		}
	}
}

/**
 * Object of logger functions.
 */
const log = ( () => {
	/**
	 * Creates a logger with block validation prefix.
	 *
	 * @param {Function} logger Original logger function.
	 *
	 * @return {Function} Augmented logger function.
	 */
	function createLogger( logger ) {
		// In test environments, pre-process the sprintf message to improve
		// readability of error messages. We'd prefer to avoid pulling in this
		// dependency in runtime environments, and it can be dropped by a combo
		// of Webpack env substitution + UglifyJS dead code elimination.
		if ( process.env.NODE_ENV === 'test' ) {
			return ( ...args ) => logger( require( 'sprintf-js' ).sprintf( ...args ) );
		}

		return ( message, ...args ) => logger( 'Block validation: ' + message, ...args );
	}

	return {
		/* eslint-disable no-console */
		error: createLogger( console.error ),
		warning: createLogger( console.warn ),
		/* eslint-enable no-console */
	};
} )();

/**
 * Given a specified string, returns an array of strings split by consecutive
 * whitespace, ignoring leading or trailing whitespace.
 *
 * @param {string} text Original text.
 *
 * @return {string[]} Text pieces split on whitespace.
 */
export function getTextPiecesSplitOnWhitespace( text ) {
	return text.trim().split( REGEXP_WHITESPACE );
}

/**
 * Given a specified string, returns a new trimmed string where all consecutive
 * whitespace is collapsed to a single space.
 *
 * @param {string} text Original text.
 *
 * @return {string} Trimmed text with consecutive whitespace collapsed.
 */
export function getTextWithCollapsedWhitespace( text ) {
	// This is an overly simplified whitespace comparison. The specification is
	// more prescriptive of whitespace behavior in inline and block contexts.
	//
	// See: https://medium.com/@patrickbrosset/when-does-white-space-matter-in-html-b90e8a7cdd33
	return getTextPiecesSplitOnWhitespace( text ).join( ' ' );
}

/**
 * Returns attribute pairs of the given StartTag token, including only pairs
 * where the value is non-empty or the attribute is a boolean attribute, an
 * enumerated attribute, or a custom data- attribute.
 *
 * @see MEANINGFUL_ATTRIBUTES
 *
 * @param {Object} token StartTag token.
 *
 * @return {Array[]} Attribute pairs.
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
 * @param {Object} actual   Actual token.
 * @param {Object} expected Expected token.
 *
 * @return {boolean} Whether two text tokens are equivalent.
 */
export function isEquivalentTextTokens( actual, expected ) {
	// This function is intentionally written as syntactically "ugly" as a hot
	// path optimization. Text is progressively normalized in order from least-
	// to-most operationally expensive, until the earliest point at which text
	// can be confidently inferred as being equal.
	let actualChars = actual.chars;
	let expectedChars = expected.chars;

	for ( let i = 0; i < TEXT_NORMALIZATIONS.length; i++ ) {
		const normalize = TEXT_NORMALIZATIONS[ i ];

		actualChars = normalize( actualChars );
		expectedChars = normalize( expectedChars );

		if ( actualChars === expectedChars ) {
			return true;
		}
	}

	log.warning( 'Expected text `%s`, saw `%s`.', expected.chars, actual.chars );

	return false;
}

/**
 * Given a style value, returns a normalized style value for strict equality
 * comparison.
 *
 * @param {string} value Style value.
 *
 * @return {string} Normalized style value.
 */
export function getNormalizedStyleValue( value ) {
	return value
		// Normalize URL type to omit whitespace or quotes
		.replace( REGEXP_STYLE_URL_TYPE, 'url($1)' );
}

/**
 * Given a style attribute string, returns an object of style properties.
 *
 * @param {string} text Style attribute.
 *
 * @return {Object} Style properties.
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
	class: ( actual, expected ) => {
		// Class matches if members are the same, even if out of order or
		// superfluous whitespace between.
		return ! xor( ...[ actual, expected ].map( getTextPiecesSplitOnWhitespace ) ).length;
	},
	style: ( actual, expected ) => {
		return isEqual( ...[ actual, expected ].map( getStyleProperties ) );
	},
	// For each boolean attribute, mere presence of attribute in both is enough
	// to assume equivalence.
	...fromPairs( BOOLEAN_ATTRIBUTES.map( ( attribute ) => [ attribute, stubTrue ] ) ),
};

/**
 * Given two sets of attribute tuples, returns true if the attribute sets are
 * equivalent.
 *
 * @param {Array[]} actual   Actual attributes tuples.
 * @param {Array[]} expected Expected attributes tuples.
 *
 * @return {boolean} Whether attributes are equivalent.
 */
export function isEqualTagAttributePairs( actual, expected ) {
	// Attributes is tokenized as tuples. Their lengths should match. This also
	// avoids us needing to check both attributes sets, since if A has any keys
	// which do not exist in B, we know the sets to be different.
	if ( actual.length !== expected.length ) {
		log.warning( 'Expected attributes %j, instead saw %j.', expected, actual );
		return false;
	}

	// Convert tuples to object for ease of lookup
	const [ actualAttributes, expectedAttributes ] = [ actual, expected ].map( fromPairs );

	for ( const name in actualAttributes ) {
		// As noted above, if missing member in B, assume different
		if ( ! expectedAttributes.hasOwnProperty( name ) ) {
			log.warning( 'Encountered unexpected attribute `%s`.', name );
			return false;
		}

		const actualValue = actualAttributes[ name ];
		const expectedValue = expectedAttributes[ name ];

		const isEqualAttributes = isEqualAttributesOfName[ name ];
		if ( isEqualAttributes ) {
			// Defer custom attribute equality handling
			if ( ! isEqualAttributes( actualValue, expectedValue ) ) {
				log.warning( 'Expected attribute `%s` of value `%s`, saw `%s`.', name, expectedValue, actualValue );
				return false;
			}
		} else if ( actualValue !== expectedValue ) {
			// Otherwise strict inequality should bail
			log.warning( 'Expected attribute `%s` of value `%s`, saw `%s`.', name, expectedValue, actualValue );
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
	StartTag: ( actual, expected ) => {
		if ( actual.tagName !== expected.tagName ) {
			log.warning( 'Expected tag name `%s`, instead saw `%s`.', expected.tagName, actual.tagName );
			return false;
		}

		return isEqualTagAttributePairs(
			...[ actual, expected ].map( getMeaningfulAttributePairs )
		);
	},
	Chars: isEquivalentTextTokens,
	Comment: isEquivalentTextTokens,
};

/**
 * Given an array of tokens, returns the first token which is not purely
 * whitespace.
 *
 * Mutates the tokens array.
 *
 * @param {Object[]} tokens Set of tokens to search.
 *
 * @return {Object} Next non-whitespace token.
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
 * Tokenize an HTML string, gracefully handling any errors thrown during
 * underlying tokenization.
 *
 * @param {string} html HTML string to tokenize.
 *
 * @return {Object[]|null} Array of valid tokenized HTML elements, or null on error
 */
function getHTMLTokens( html ) {
	try {
		return new Tokenizer( new DecodeEntityParser() ).tokenize( html );
	} catch ( e ) {
		log.warning( 'Malformed HTML detected: %s', html );
	}

	return null;
}

/**
 * Returns true if the next HTML token closes the current token.
 *
 * @param {Object} currentToken Current token to compare with.
 * @param {Object|undefined} nextToken Next token to compare against.
 *
 * @return {boolean} true if `nextToken` closes `currentToken`, false otherwise
 */
export function isClosedByToken( currentToken, nextToken ) {
	// Ensure this is a self closed token
	if ( ! currentToken.selfClosing ) {
		return false;
	}

	// Check token names and determine if nextToken is the closing tag for currentToken
	if ( nextToken && nextToken.tagName === currentToken.tagName && nextToken.type === 'EndTag' ) {
		return true;
	}

	return false;
}

/**
 * Returns true if the given HTML strings are effectively equivalent, or
 * false otherwise. Invalid HTML is not considered equivalent, even if the
 * strings directly match.
 *
 * @param {string} actual Actual HTML string.
 * @param {string} expected Expected HTML string.
 *
 * @return {boolean} Whether HTML strings are equivalent.
 */
export function isEquivalentHTML( actual, expected ) {
	// Tokenize input content and reserialized save content
	const [ actualTokens, expectedTokens ] = [ actual, expected ].map( getHTMLTokens );

	// If either is malformed then stop comparing - the strings are not equivalent
	if ( ! actualTokens || ! expectedTokens ) {
		return false;
	}

	let actualToken, expectedToken;
	while ( ( actualToken = getNextNonWhitespaceToken( actualTokens ) ) ) {
		expectedToken = getNextNonWhitespaceToken( expectedTokens );

		// Inequal if exhausted all expected tokens
		if ( ! expectedToken ) {
			log.warning( 'Expected end of content, instead saw %j.', actualToken );
			return false;
		}

		// Inequal if next non-whitespace token of each set are not same type
		if ( actualToken.type !== expectedToken.type ) {
			log.warning( 'Expected token of type `%s` (%j), instead saw `%s` (%j).', expectedToken.type, expectedToken, actualToken.type, actualToken );
			return false;
		}

		// Defer custom token type equality handling, otherwise continue and
		// assume as equal
		const isEqualTokens = isEqualTokensOfType[ actualToken.type ];
		if ( isEqualTokens && ! isEqualTokens( actualToken, expectedToken ) ) {
			return false;
		}

		// Peek at the next tokens (actual and expected) to see if they close
		// a self-closing tag
		if ( isClosedByToken( actualToken, expectedTokens[ 0 ] ) ) {
			// Consume the next expected token that closes the current actual
			// self-closing token
			getNextNonWhitespaceToken( expectedTokens );
		} else if ( isClosedByToken( expectedToken, actualTokens[ 0 ] ) ) {
			// Consume the next actual token that closes the current expected
			// self-closing token
			getNextNonWhitespaceToken( actualTokens );
		}
	}

	if ( ( expectedToken = getNextNonWhitespaceToken( expectedTokens ) ) ) {
		// If any non-whitespace tokens remain in expected token set, this
		// indicates inequality
		log.warning( 'Expected %j, instead saw end of content.', expectedToken );
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
 * @param {string|Object} blockTypeOrName      Block type.
 * @param {Object}        attributes           Parsed block attributes.
 * @param {string}        originalBlockContent Original block content.
 *
 * @return {boolean} Whether block is valid.
 */
export function isValidBlockContent( blockTypeOrName, attributes, originalBlockContent ) {
	const blockType = normalizeBlockType( blockTypeOrName );
	let generatedBlockContent;
	try {
		generatedBlockContent = getSaveContent( blockType, attributes );
	} catch ( error ) {
		log.error( 'Block validation failed because an error occurred while generating block content:\n\n%s', error.toString() );
		return false;
	}

	const isValid = isEquivalentHTML( originalBlockContent, generatedBlockContent );
	if ( ! isValid ) {
		log.error(
			'Block validation failed for `%s` (%o).\n\nContent generated by `save` function:\n\n%s\n\nContent retrieved from post body:\n\n%s',
			blockType.name,
			blockType,
			generatedBlockContent,
			originalBlockContent
		);
	}

	return isValid;
}
