/**
 * External dependencies
 */
import { Tokenizer } from 'simple-html-tokenizer';
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { createLogger, createQueuedLogger } from './logger';
import { getSaveContent } from '../serializer';
import {
	getFreeformContentHandlerName,
	getUnregisteredTypeHandlerName,
} from '../registration';
import { normalizeBlockType } from '../utils';

/** @typedef {import('../parser').WPBlock} WPBlock */
/** @typedef {import('../registration').WPBlockType} WPBlockType */
/** @typedef {import('./logger').LoggerItem} LoggerItem */

/**
 * Validation level constants ordered by decreasing certainty over content integrity.
 * Lower numbers indicate higher confidence in content preservation.
 *
 * @type {Object}
 */
export const VALIDATION_LEVEL = {
	/**
	 * Idempotent operation where save(attributes) produces exactly the original content.
	 * Perfect match - no changes needed.
	 */
	VALID_BLOCK: 0,

	/**
	 * Source matched against defined deprecations sequentially.
	 * The block was successfully migrated from an older version.
	 */
	MIGRATED_BLOCK: 1,

	/**
	 * Conservative reconstruction with only attribute-level differences.
	 * Content structure is intact but attributes differ (e.g., missing generated classes).
	 * This level is always allowed and considered safe.
	 */
	RECONSTRUCTED_BLOCK: 2,

	/**
	 * Content regenerated from attributes.
	 * Content may have structural differences (wrong tags, different text, etc.)
	 * but can be regenerated from attributes. Requires allowsReconstruction !== false.
	 * Includes freeform/unregistered blocks as they trust content as-is.
	 */
	REGENERATED_BLOCK: 3,

	/**
	 * Cannot be safely restored; requires user intervention.
	 * All other validation levels failed.
	 */
	INVALID_BLOCK: 4,
};

/**
 * Human-readable names for validation levels.
 *
 * @type {Object}
 */
export const VALIDATION_LEVEL_NAME = {
	[ VALIDATION_LEVEL.VALID_BLOCK ]: 'ValidBlock',
	[ VALIDATION_LEVEL.MIGRATED_BLOCK ]: 'MigratedBlock',
	[ VALIDATION_LEVEL.RECONSTRUCTED_BLOCK ]: 'ReconstructedBlock',
	[ VALIDATION_LEVEL.REGENERATED_BLOCK ]: 'RegeneratedBlock',
	[ VALIDATION_LEVEL.INVALID_BLOCK ]: 'InvalidBlock',
};

const identity = ( x ) => x;

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
 * Object.keys( Array.from( document.querySelectorAll( '#attributes-1 > tbody > tr' ) )
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
 * Object.keys( Array.from( document.querySelectorAll( '#attributes-1 > tbody > tr' ) )
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
const TEXT_NORMALIZATIONS = [ identity, getTextWithCollapsedWhitespace ];

/**
 * Regular expression matching a named character reference. In lieu of bundling
 * a full set of references, the pattern covers the minimal necessary to test
 * positively against the full set.
 *
 * "The ampersand must be followed by one of the names given in the named
 * character references section, using the same case."
 *
 * Tested against "12.5 Named character references":
 *
 * ```
 * const references = Array.from( document.querySelectorAll(
 *     '#named-character-references-table tr[id^=entity-] td:first-child'
 * ) ).map( ( code ) => code.textContent )
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
 * Substitute EntityParser class for `simple-html-tokenizer` which uses the
 * implementation of `decodeEntities` from `html-entities`, in order to avoid
 * bundling a massive named character reference.
 *
 * @see https://github.com/tildeio/simple-html-tokenizer/tree/HEAD/src/entity-parser.ts
 */
export class DecodeEntityParser {
	/**
	 * Returns a substitute string for an entity string sequence between `&`
	 * and `;`, or undefined if no substitution should occur.
	 *
	 * @param {string} entity Entity fragment discovered in HTML.
	 *
	 * @return {string | undefined} Entity substitute value.
	 */
	parse( entity ) {
		if ( isValidCharacterReference( entity ) ) {
			return decodeEntities( '&' + entity + ';' );
		}
	}
}

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
			MEANINGFUL_ATTRIBUTES.includes( key )
		);
	} );
}

/**
 * Returns true if two text tokens (with `chars` property) are equivalent, or
 * false otherwise.
 *
 * @param {Object} actual   Actual token.
 * @param {Object} expected Expected token.
 * @param {Object} logger   Validation logger object.
 *
 * @return {boolean} Whether two text tokens are equivalent.
 */
export function isEquivalentTextTokens(
	actual,
	expected,
	logger = createLogger()
) {
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

	logger.warning(
		'Expected text `%s`, saw `%s`.',
		expected.chars,
		actual.chars
	);

	return false;
}

/**
 * Given a CSS length value, returns a normalized CSS length value for strict equality
 * comparison.
 *
 * @param {string} value CSS length value.
 *
 * @return {string} Normalized CSS length value.
 */
export function getNormalizedLength( value ) {
	if ( 0 === parseFloat( value ) ) {
		return '0';
	}
	// Normalize strings with floats to always include a leading zero.
	if ( value.indexOf( '.' ) === 0 ) {
		return '0' + value;
	}

	return value;
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
	const textPieces = getTextPiecesSplitOnWhitespace( value );
	const normalizedPieces = textPieces.map( getNormalizedLength );
	const result = normalizedPieces.join( ' ' );

	return (
		result
			// Normalize URL type to omit whitespace or quotes.
			.replace( REGEXP_STYLE_URL_TYPE, 'url($1)' )
	);
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
		// Split on property assignment.
		.split( ';' )
		// For each property assignment...
		.map( ( style ) => {
			// ...split further into key-value pairs.
			const [ key, ...valueParts ] = style.split( ':' );
			const value = valueParts.join( ':' );

			return [ key.trim(), getNormalizedStyleValue( value.trim() ) ];
		} );

	return Object.fromEntries( pairs );
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
		const [ actualPieces, expectedPieces ] = [ actual, expected ].map(
			getTextPiecesSplitOnWhitespace
		);
		const actualDiff = actualPieces.filter(
			( c ) => ! expectedPieces.includes( c )
		);
		const expectedDiff = expectedPieces.filter(
			( c ) => ! actualPieces.includes( c )
		);

		return actualDiff.length === 0 && expectedDiff.length === 0;
	},
	style: ( actual, expected ) => {
		return fastDeepEqual(
			...[ actual, expected ].map( getStyleProperties )
		);
	},
	// For each boolean attribute, mere presence of attribute in both is enough
	// to assume equivalence.
	...Object.fromEntries(
		BOOLEAN_ATTRIBUTES.map( ( attribute ) => [ attribute, () => true ] )
	),
};

/**
 * Given two sets of attribute tuples, returns true if the attribute sets are
 * equivalent.
 *
 * @param {Array[]} actual   Actual attributes tuples.
 * @param {Array[]} expected Expected attributes tuples.
 * @param {Object}  logger   Validation logger object.
 *
 * @return {boolean} Whether attributes are equivalent.
 */
export function isEqualTagAttributePairs(
	actual,
	expected,
	logger = createLogger()
) {
	// Attributes is tokenized as tuples. Their lengths should match. This also
	// avoids us needing to check both attributes sets, since if A has any keys
	// which do not exist in B, we know the sets to be different.
	if ( actual.length !== expected.length ) {
		logger.warning(
			'Expected attributes %o, instead saw %o.',
			expected,
			actual
		);
		return false;
	}

	// Attributes are not guaranteed to occur in the same order. For validating
	// actual attributes, first convert the set of expected attribute values to
	// an object, for lookup by key.
	const expectedAttributes = {};
	for ( let i = 0; i < expected.length; i++ ) {
		expectedAttributes[ expected[ i ][ 0 ].toLowerCase() ] =
			expected[ i ][ 1 ];
	}

	for ( let i = 0; i < actual.length; i++ ) {
		const [ name, actualValue ] = actual[ i ];
		const nameLower = name.toLowerCase();

		// As noted above, if missing member in B, assume different.
		if ( ! expectedAttributes.hasOwnProperty( nameLower ) ) {
			logger.warning( 'Encountered unexpected attribute `%s`.', name );
			return false;
		}

		const expectedValue = expectedAttributes[ nameLower ];
		const isEqualAttributes = isEqualAttributesOfName[ nameLower ];

		if ( isEqualAttributes ) {
			// Defer custom attribute equality handling.
			if ( ! isEqualAttributes( actualValue, expectedValue ) ) {
				logger.warning(
					'Expected attribute `%s` of value `%s`, saw `%s`.',
					name,
					expectedValue,
					actualValue
				);
				return false;
			}
		} else if ( actualValue !== expectedValue ) {
			// Otherwise strict inequality should bail.
			logger.warning(
				'Expected attribute `%s` of value `%s`, saw `%s`.',
				name,
				expectedValue,
				actualValue
			);
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
	StartTag: ( actual, expected, logger = createLogger() ) => {
		if (
			actual.tagName !== expected.tagName &&
			// Optimization: Use short-circuit evaluation to defer case-
			// insensitive check on the assumption that the majority case will
			// have exactly equal tag names.
			actual.tagName.toLowerCase() !== expected.tagName.toLowerCase()
		) {
			logger.warning(
				'Expected tag name `%s`, instead saw `%s`.',
				expected.tagName,
				actual.tagName
			);
			return false;
		}

		return isEqualTagAttributePairs(
			...[ actual, expected ].map( getMeaningfulAttributePairs ),
			logger
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
 * @return {Object | undefined} Next non-whitespace token.
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
 * @param {string} html   HTML string to tokenize.
 * @param {Object} logger Validation logger object.
 *
 * @return {Object[]|null} Array of valid tokenized HTML elements, or null on error
 */
function getHTMLTokens( html, logger = createLogger() ) {
	try {
		return new Tokenizer( new DecodeEntityParser() ).tokenize( html );
	} catch ( e ) {
		logger.warning( 'Malformed HTML detected: %s', html );
	}

	return null;
}

/**
 * Returns true if the next HTML token closes the current token.
 *
 * @param {Object}           currentToken Current token to compare with.
 * @param {Object|undefined} nextToken    Next token to compare against.
 *
 * @return {boolean} true if `nextToken` closes `currentToken`, false otherwise
 */
export function isClosedByToken( currentToken, nextToken ) {
	// Ensure this is a self closed token.
	if ( ! currentToken.selfClosing ) {
		return false;
	}

	// Check token names and determine if nextToken is the closing tag for currentToken.
	if (
		nextToken &&
		nextToken.tagName === currentToken.tagName &&
		nextToken.type === 'EndTag'
	) {
		return true;
	}

	return false;
}

/**
 * Returns true if the given HTML strings are effectively equivalent, or
 * false otherwise. Invalid HTML is not considered equivalent, even if the
 * strings directly match.
 *
 * @param {string} actual   Actual HTML string.
 * @param {string} expected Expected HTML string.
 * @param {Object} logger   Validation logger object.
 *
 * @return {boolean} Whether HTML strings are equivalent.
 */
export function isEquivalentHTML( actual, expected, logger = createLogger() ) {
	// Short-circuit if markup is identical.
	if ( actual === expected ) {
		return true;
	}

	// Tokenize input content and reserialized save content.
	const [ actualTokens, expectedTokens ] = [ actual, expected ].map(
		( html ) => getHTMLTokens( html, logger )
	);

	// If either is malformed then stop comparing - the strings are not equivalent.
	if ( ! actualTokens || ! expectedTokens ) {
		return false;
	}

	let actualToken, expectedToken;
	while ( ( actualToken = getNextNonWhitespaceToken( actualTokens ) ) ) {
		expectedToken = getNextNonWhitespaceToken( expectedTokens );

		// Inequal if exhausted all expected tokens.
		if ( ! expectedToken ) {
			logger.warning(
				'Expected end of content, instead saw %o.',
				actualToken
			);
			return false;
		}

		// Inequal if next non-whitespace token of each set are not same type.
		if ( actualToken.type !== expectedToken.type ) {
			logger.warning(
				'Expected token of type `%s` (%o), instead saw `%s` (%o).',
				expectedToken.type,
				expectedToken,
				actualToken.type,
				actualToken
			);
			return false;
		}

		// Defer custom token type equality handling, otherwise continue and
		// assume as equal.
		const isEqualTokens = isEqualTokensOfType[ actualToken.type ];
		if (
			isEqualTokens &&
			! isEqualTokens( actualToken, expectedToken, logger )
		) {
			return false;
		}

		// Peek at the next tokens (actual and expected) to see if they close
		// a self-closing tag.
		if ( isClosedByToken( actualToken, expectedTokens[ 0 ] ) ) {
			// Consume the next expected token that closes the current actual
			// self-closing token.
			getNextNonWhitespaceToken( expectedTokens );
		} else if ( isClosedByToken( expectedToken, actualTokens[ 0 ] ) ) {
			// Consume the next actual token that closes the current expected
			// self-closing token.
			getNextNonWhitespaceToken( actualTokens );
		}
	}

	if ( ( expectedToken = getNextNonWhitespaceToken( expectedTokens ) ) ) {
		// If any non-whitespace tokens remain in expected token set, this
		// indicates inequality.
		logger.warning(
			'Expected %o, instead saw end of content.',
			expectedToken
		);
		return false;
	}

	return true;
}

/**
 * Returns true if validation issues are only related to attributes
 * (not structural problems like wrong tags, text differences, or missing elements).
 * This is used to distinguish Level 2 (ReconstructedBlock) from Level 3 (RegeneratedBlock).
 *
 * @param {Array} validationIssues Array of validation issues from logger.
 *
 * @return {boolean} Whether issues are only attribute-related.
 */
export function areOnlyAttributeDifferences( validationIssues ) {
	if ( ! validationIssues || validationIssues.length === 0 ) {
		// No issues means the HTML matches exactly.
		// This shouldn't happen since Level 0 would have caught it.
		return false;
	}

	// Level 2 only accepts attribute-related issues.
	// Text differences and structural differences are rejected.
	// This prevents false positives where wrong content passes as reconstructable.
	return validationIssues.every( ( issue ) => {
		const message = issue.args?.[ 0 ] || '';

		// Reject text content differences - these are structural, not attribute-only.
		if ( message.includes( 'Expected text' ) ) {
			return false;
		}

		// Accept direct attribute-related messages:
		// - "Expected attribute `X` of value Y, saw Z"
		// - "Expected attributes Array(X), saw Array(Y)"
		// - "Unexpected attribute `X`"
		const isDirectAttributeIssue =
			message.includes( 'Expected attribute' ) ||
			message.includes( 'Expected attributes' ) ||
			message.includes( 'Unexpected attribute' );

		if ( isDirectAttributeIssue ) {
			return true;
		}

		// Handle token type mismatches that could be attribute-related.
		// Example: "Expected token of type `Chars` (%o), instead saw `StartTag` (%o)"
		// This happens when the tokenizer sees raw HTML vs a parsed tag.
		// We need to check if both tokens refer to the same HTML element.
		if ( message.includes( 'Expected token of type' ) ) {
			// Extract the token objects from the logger arguments.
			const expectedToken = issue.args?.[ 2 ];
			const actualToken = issue.args?.[ 4 ];

			// Try to extract tag names from both tokens.
			let expectedTagName = null;
			let actualTagName = null;

			// Extract from expected token.
			if ( expectedToken?.type === 'Chars' && expectedToken?.chars ) {
				// Chars token contains raw HTML - extract tag name.
				const match = expectedToken.chars.match( /<(\w+)/ );
				expectedTagName = match?.[ 1 ];
			} else if ( expectedToken?.tagName ) {
				expectedTagName = expectedToken.tagName;
			}

			// Extract from actual token.
			if ( actualToken?.tagName ) {
				actualTagName = actualToken.tagName;
			} else if ( actualToken?.type === 'Chars' && actualToken?.chars ) {
				const match = actualToken.chars.match( /<(\w+)/ );
				actualTagName = match?.[ 1 ];
			}

			// If both tokens refer to the same HTML tag, this is likely an attribute difference.
			// Example: <h6> vs <h6 class="has-text-color"> - same tag, different attributes.
			// If tags are different, it's a structural issue and belongs in Level 3.
			if (
				expectedTagName &&
				actualTagName &&
				expectedTagName === actualTagName
			) {
				return true;
			}

			// Different tags or couldn't extract tag names means structural difference.
			return false;
		}

		// All other issue types (missing elements, extra content, etc.) are structural.
		return false;
	} );
}

/**
 * Creates a validation result object with the specified level.
 *
 * @param {number}            validationLevel       The validation level (0-5).
 * @param {Array<LoggerItem>} [validationIssues=[]] Array of validation issues.
 *
 * @return {Object} Validation result with isValid computed property.
 */
export function createValidationResult(
	validationLevel,
	validationIssues = []
) {
	return {
		validationLevel,
		validationIssues,
		/**
		 * Returns whether the block is considered valid.
		 * All levels are valid except INVALID_BLOCK.
		 *
		 * @return {boolean} Whether the block is considered valid.
		 */
		get isValid() {
			return this.validationLevel < VALIDATION_LEVEL.INVALID_BLOCK;
		},
	};
}

/**
 * Returns an object with `isValid` property set to `true` if the parsed block
 * is valid given the input content. A block is considered valid if, when serialized
 * with assumed attributes, the content matches the original value. If block is
 * invalid, this function returns all validations issues as well.
 *
 * @param {string|Object} blockTypeOrName      Block type.
 * @param {Object}        attributes           Parsed block attributes.
 * @param {string}        originalBlockContent Original block content.
 * @param {Object}        logger               Validation logger object.
 *
 * @return {Object} Whether block is valid and contains validation messages.
 */

/**
 * Returns validation results for a parsed block. The validation system uses a
 * 5-level classification to determine content integrity with varying degrees of
 * confidence, from perfect match (ValidBlock) to requiring user intervention (InvalidBlock).
 *
 * Note: Level 1 (MigratedBlock) is handled by the parser during deprecation checks,
 * not by this function. This function handles Levels 0, 2, 3, and 4.
 *
 * @param {WPBlock}            block                          Block object.
 * @param {WPBlockType|string} [blockTypeOrName = block.name] Block type or name, inferred from block if not given.
 *
 * @return {[boolean, Array<LoggerItem>, Object]} Validation results tuple:
 *                                                - isValid: boolean indicating if block is valid
 *                                                - issues: array of validation issues
 *                                                - metadata: object containing validationLevel, originalContent, generatedContent
 */
export function validateBlock( block, blockTypeOrName = block.name ) {
	const isFallbackBlock =
		block.name === getFreeformContentHandlerName() ||
		block.name === getUnregisteredTypeHandlerName();

	// Shortcut: Fallback blocks (freeform/unregistered) always use Level 3.
	// These blocks have no save() function to compare against, so we trust
	// the content as-is and mark them as regenerated.
	if ( isFallbackBlock ) {
		return [
			true,
			[],
			{
				validationLevel: VALIDATION_LEVEL.REGENERATED_BLOCK,
				originalContent: block.originalContent,
				generatedContent: block.originalContent, // No regeneration for fallback blocks
			},
		];
	}

	const logger = createQueuedLogger();
	const blockType = normalizeBlockType( blockTypeOrName );

	// If block type doesn't exist (unregistered), treat as invalid
	if ( ! blockType ) {
		logger.error(
			'Block type `%s` is not registered.',
			typeof blockTypeOrName === 'string'
				? blockTypeOrName
				: blockTypeOrName?.name || block.name
		);
		return [
			false,
			logger.getItems(),
			{
				validationLevel: VALIDATION_LEVEL.INVALID_BLOCK,
				originalContent: block.originalContent,
				generatedContent: null,
			},
		];
	}

	let generatedBlockContent;
	try {
		generatedBlockContent = getSaveContent( blockType, block.attributes );
	} catch ( error ) {
		logger.error(
			'Block validation failed because an error occurred while generating block content:\n\n%s',
			error.toString()
		);

		return [
			false,
			logger.getItems(),
			{
				validationLevel: VALIDATION_LEVEL.INVALID_BLOCK,
				originalContent: block.originalContent,
				generatedContent: null,
			},
		];
	}

	// Level 0: ValidBlock - Perfect match (idempotent save operation)
	const isValid = isEquivalentHTML(
		block.originalContent,
		generatedBlockContent,
		logger
	);

	if ( isValid ) {
		// Valid blocks return empty issues array
		return [
			true,
			[],
			{
				validationLevel: VALIDATION_LEVEL.VALID_BLOCK,
				originalContent: block.originalContent,
				generatedContent: generatedBlockContent,
			},
		];
	}

	// Level 2: ReconstructedBlock - Conservative reconstruction
	// Only attribute-level differences (missing classes, different attribute values).
	// This level is always safe and doesn't check allowsReconstruction.
	// Structural differences (wrong tags, text content) will skip to Level 3.
	if ( block.attributes ) {
		// Get validation issues from logger to check if they're only attribute-related
		const validationIssues = logger.getItems();

		// Pass Level 2 if differences are purely attribute-related
		// (missing classes, different attribute values, etc.)
		// Structural issues (wrong tags, wrong content) move to Level 3
		if ( areOnlyAttributeDifferences( validationIssues ) ) {
			return [
				true,
				[],
				{
					validationLevel: VALIDATION_LEVEL.RECONSTRUCTED_BLOCK,
					originalContent: block.originalContent,
					generatedContent: generatedBlockContent,
				},
			];
		}
	}

	// Level 3: RegeneratedBlock - Content regenerated from attributes
	// Requires allowsReconstruction !== false (default is true).
	// Accepts any differences including structural ones (wrong tags, different text).
	// At this level, we trust that attributes contain enough information to regenerate
	// the block correctly, even if the HTML is completely different.
	const allowsReconstruction = blockType.allowsReconstruction !== false;

	if ( allowsReconstruction && block.attributes ) {
		// Verify generated content is reasonable.
		// If original content exists but generated is empty, this may be
		// a deprecated block with the wrong attribute schema.
		const hasOriginalContent =
			block.originalContent && block.originalContent.trim().length > 0;
		const hasGeneratedContent =
			generatedBlockContent && generatedBlockContent.trim().length > 0;

		// Pass Level 3 when both have content, both are empty, or when
		// the original is empty but generated has content (adding generated classes/structure).
		const contentIsReasonable = hasGeneratedContent || ! hasOriginalContent;

		if ( contentIsReasonable ) {
			// Log regeneration for visibility and debugging.
			// eslint-disable-next-line no-console
			console.log(
				`Block "${ blockType.name }" regenerated from attributes (Level 3).`,
				'\nOriginal:',
				block.originalContent,
				'\nGenerated:',
				generatedBlockContent
			);

			return [
				true,
				[],
				{
					validationLevel: VALIDATION_LEVEL.REGENERATED_BLOCK,
					originalContent: block.originalContent,
					generatedContent: generatedBlockContent,
				},
			];
		}
	}

	// Set validation level to invalid.
	logger.error(
		'Block validation failed for `%s` (%o).\n\nContent generated by `save` function:\n\n%s\n\nContent retrieved from post body:\n\n%s',
		blockType.name,
		blockType,
		generatedBlockContent,
		block.originalContent
	);

	return [
		false,
		logger.getItems(),
		{
			validationLevel: VALIDATION_LEVEL.INVALID_BLOCK,
			originalContent: block.originalContent,
			generatedContent: generatedBlockContent,
		},
	];
}

/**
 * Returns true if the parsed block is valid given the input content. A block
 * is considered valid if, when serialized with assumed attributes, the content
 * matches the original value.
 *
 * Logs to console in development environments when invalid.
 *
 * @deprecated Use validateBlock instead to avoid data loss.
 *
 * @param {string|Object} blockTypeOrName      Block type.
 * @param {Object}        attributes           Parsed block attributes.
 * @param {string}        originalBlockContent Original block content.
 *
 * @return {boolean} Whether block is valid.
 */
export function isValidBlockContent(
	blockTypeOrName,
	attributes,
	originalBlockContent
) {
	deprecated( 'isValidBlockContent introduces opportunity for data loss', {
		since: '12.6',
		plugin: 'Gutenberg',
		alternative: 'validateBlock',
	} );

	const blockType = normalizeBlockType( blockTypeOrName );
	const block = {
		name: blockType.name,
		attributes,
		innerBlocks: [],
		originalContent: originalBlockContent,
	};
	const [ isValid ] = validateBlock( block, blockType );

	return isValid;
}
