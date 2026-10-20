import { Tokenizer } from 'simple-html-tokenizer';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import deprecated from '@wordpress/deprecated';
import { decodeEntities } from '@wordpress/html-entities';
import { createLogger, createQueuedLogger } from './logger';
import type { Logger, LoggerItem } from './types';
import { getSaveContent } from '../serializer';
import {
	getFreeformContentHandlerName,
	getUnregisteredTypeHandlerName,
} from '../registration';
import { normalizeBlockType } from '../utils';
import type {
	Block,
	BlockType,
	ValidationLevel,
	ValidationMetadata,
} from '../../types';

interface HTMLToken {
	type: string;
	tagName?: string;
	chars?: string;
	selfClosing?: boolean;
	attributes?: Array< [ string, string ] >;
}

/**
 * Validation level constants ordered by decreasing certainty over content
 * integrity. Lower numbers indicate higher confidence in content preservation.
 */
export const VALIDATION_LEVEL = {
	/**
	 * The `save` output for the parsed attributes is equivalent to the stored
	 * content. Nothing needs to change. Freeform content and unregistered
	 * blocks are also classified here, as their raw content is kept as-is.
	 */
	VALID_BLOCK: 0,

	/**
	 * The stored content matched one of the block type's deprecations and the
	 * block was migrated to the current version. Assigned by the parser.
	 */
	MIGRATED_BLOCK: 1,

	/**
	 * The stored content has the same elements, text and attributes as the
	 * `save` output, except that the `save` output adds attributes or uses
	 * different presentational attribute values (e.g. class names generated
	 * from attributes are missing). Regenerating the block from its
	 * attributes only adds to the markup; it never drops an element, text,
	 * attribute, class name or style property, nor changes a media source,
	 * link target or alternative text.
	 */
	RECONSTRUCTED_BLOCK: 2,

	/**
	 * The stored content differs structurally from the `save` output (e.g.
	 * wrong tags, malformed markup, or attributes that the block does not
	 * model), but regenerating the block from its attributes preserves all of
	 * its content: text, media sources and link targets.
	 */
	REGENERATED_BLOCK: 3,

	/**
	 * The block cannot be safely regenerated from its attributes: text would
	 * be lost, the block type opted out of reconstruction, or `save` failed.
	 * Requires user intervention.
	 */
	INVALID_BLOCK: 4,
} as const satisfies Record< string, ValidationLevel >;

/**
 * Human-readable names for validation levels.
 */
export const VALIDATION_LEVEL_NAME: Record< ValidationLevel, string > = {
	[ VALIDATION_LEVEL.VALID_BLOCK ]: 'ValidBlock',
	[ VALIDATION_LEVEL.MIGRATED_BLOCK ]: 'MigratedBlock',
	[ VALIDATION_LEVEL.RECONSTRUCTED_BLOCK ]: 'ReconstructedBlock',
	[ VALIDATION_LEVEL.REGENERATED_BLOCK ]: 'RegeneratedBlock',
	[ VALIDATION_LEVEL.INVALID_BLOCK ]: 'InvalidBlock',
};

const identity = ( x: string ): string => x;

/**
 * Globally matches any consecutive whitespace
 */
const REGEXP_WHITESPACE = /[\t\n\r\v\f ]+/g;

/**
 * Matches a string containing only whitespace
 */
const REGEXP_ONLY_WHITESPACE = /^[\t\n\r\v\f ]*$/;

/**
 * Matches a CSS URL type value
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
 */
const BOOLEAN_ATTRIBUTES: string[] = [
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
 */
const ENUMERATED_ATTRIBUTES: string[] = [
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
 */
const MEANINGFUL_ATTRIBUTES: string[] = [
	...BOOLEAN_ATTRIBUTES,
	...ENUMERATED_ATTRIBUTES,
];

/**
 * Array of functions which receive a text string on which to apply normalizing
 * behavior for consideration in text token equivalence, carefully ordered from
 * least-to-most expensive operations.
 *
 */
const TEXT_NORMALIZATIONS: Array< ( text: string ) => string > = [
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
 */
const REGEXP_NAMED_CHARACTER_REFERENCE = /^[\da-z]+$/i;

/**
 * Regular expression matching a decimal character reference.
 *
 * "The ampersand must be followed by a U+0023 NUMBER SIGN character (#),
 * followed by one or more ASCII digits, representing a base-ten integer"
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#character-references
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
 */
const REGEXP_HEXADECIMAL_CHARACTER_REFERENCE = /^#x[\da-f]+$/i;

/**
 * Returns true if the given string is a valid character reference segment, or
 * false otherwise. The text should be stripped of `&` and `;` demarcations.
 *
 * @param text Text to test.
 *
 * @return Whether text is valid character reference.
 */
export function isValidCharacterReference( text: string ): boolean {
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
	 * @param entity Entity fragment discovered in HTML.
	 *
	 * @return Entity substitute value.
	 */
	parse( entity: string ): string | undefined {
		if ( isValidCharacterReference( entity ) ) {
			return decodeEntities( '&' + entity + ';' );
		}
		return undefined;
	}
}

/**
 * Given a specified string, returns an array of strings split by consecutive
 * whitespace, ignoring leading or trailing whitespace.
 *
 * @param text Original text.
 *
 * @return Text pieces split on whitespace.
 */
export function getTextPiecesSplitOnWhitespace( text: string ): string[] {
	return text.trim().split( REGEXP_WHITESPACE );
}

/**
 * Given a specified string, returns a new trimmed string where all consecutive
 * whitespace is collapsed to a single space.
 *
 * @param text Original text.
 *
 * @return Trimmed text with consecutive whitespace collapsed.
 */
export function getTextWithCollapsedWhitespace( text: string ): string {
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
 * @param token StartTag token.
 *
 * @return Attribute pairs.
 */
export function getMeaningfulAttributePairs(
	token: HTMLToken
): Array< [ string, string ] > {
	return ( token.attributes ?? [] ).filter( ( pair ) => {
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
 * @param actual   Actual token.
 * @param expected Expected token.
 * @param logger   Validation logger object.
 *
 * @return Whether two text tokens are equivalent.
 */
export function isEquivalentTextTokens(
	actual: HTMLToken,
	expected: HTMLToken,
	logger: Logger = createLogger()
): boolean {
	// This function is intentionally written as syntactically "ugly" as a hot
	// path optimization. Text is progressively normalized in order from least-
	// to-most operationally expensive, until the earliest point at which text
	// can be confidently inferred as being equal.
	let actualChars = actual.chars!;
	let expectedChars = expected.chars!;

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
 * @param value CSS length value.
 *
 * @return Normalized CSS length value.
 */
export function getNormalizedLength( value: string ): string {
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
 * @param value Style value.
 *
 * @return Normalized style value.
 */
export function getNormalizedStyleValue( value: string ): string {
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
 * @param text Style attribute.
 *
 * @return Style properties.
 */
export function getStyleProperties( text: string ): Record< string, string > {
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
 */
export const isEqualAttributesOfName: Record<
	string,
	( actual: string, expected: string ) => boolean
> = {
	class: ( actual: string, expected: string ): boolean => {
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
	style: ( actual: string, expected: string ): boolean => {
		return fastDeepEqual(
			...( [ actual, expected ].map( getStyleProperties ) as [
				Record< string, string >,
				Record< string, string >,
			] )
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
 * @param actual   Actual attributes tuples.
 * @param expected Expected attributes tuples.
 * @param logger   Validation logger object.
 *
 * @return Whether attributes are equivalent.
 */
export function isEqualTagAttributePairs(
	actual: Array< [ string, string ] >,
	expected: Array< [ string, string ] >,
	logger: Logger = createLogger()
): boolean {
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
	const expectedAttributes: Record< string, string > = {};
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
 */
export const isEqualTokensOfType: Record<
	string,
	( actual: HTMLToken, expected: HTMLToken, logger?: Logger ) => boolean
> = {
	StartTag: (
		actual: HTMLToken,
		expected: HTMLToken,
		logger: Logger = createLogger()
	): boolean => {
		if (
			actual.tagName !== expected.tagName &&
			// Optimization: Use short-circuit evaluation to defer case-
			// insensitive check on the assumption that the majority case will
			// have exactly equal tag names.
			actual.tagName!.toLowerCase() !== expected.tagName!.toLowerCase()
		) {
			logger.warning(
				'Expected tag name `%s`, instead saw `%s`.',
				expected.tagName,
				actual.tagName
			);
			return false;
		}

		return isEqualTagAttributePairs(
			...( [ actual, expected ].map( getMeaningfulAttributePairs ) as [
				Array< [ string, string ] >,
				Array< [ string, string ] >,
			] ),
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
 * @param tokens Set of tokens to search.
 *
 * @return Next non-whitespace token.
 */
export function getNextNonWhitespaceToken(
	tokens: HTMLToken[]
): HTMLToken | undefined {
	let token;
	while ( ( token = tokens.shift() ) ) {
		if ( token.type !== 'Chars' ) {
			return token;
		}

		if ( ! REGEXP_ONLY_WHITESPACE.test( token.chars! ) ) {
			return token;
		}
	}
	return undefined;
}

/**
 * Tokenize an HTML string, gracefully handling any errors thrown during
 * underlying tokenization.
 *
 * @param html   HTML string to tokenize.
 * @param logger Validation logger object.
 *
 * @return Array of valid tokenized HTML elements, or null on error
 */
function getHTMLTokens(
	html: string,
	logger: Logger = createLogger()
): HTMLToken[] | null {
	try {
		return new Tokenizer( new DecodeEntityParser() ).tokenize(
			html
		) as HTMLToken[];
	} catch {
		logger.warning( 'Malformed HTML detected: %s', html );
	}

	return null;
}

/**
 * Returns true if the next HTML token closes the current token.
 *
 * @param currentToken Current token to compare with.
 * @param nextToken    Next token to compare against.
 *
 * @return true if `nextToken` closes `currentToken`, false otherwise
 */
export function isClosedByToken(
	currentToken: HTMLToken,
	nextToken: HTMLToken | undefined
): boolean {
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
 * Attributes whose values are content in their own right, as opposed to
 * presentation which a block regenerates from its attributes: media sources,
 * link targets, embedded data and alternative text.
 */
const CONTENT_ATTRIBUTES = [
	'src',
	'srcset',
	'poster',
	'href',
	'alt',
	'data',
	'srcdoc',
	'value',
];

/**
 * Matches the URLs referenced by a CSS declaration list, e.g. background
 * images: `url(a.png)`, `url("a.png")` or `url('a.png')`.
 */
const REGEXP_STYLE_URL = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;

/**
 * Returns the URLs referenced by the given CSS declaration list.
 *
 * @param style Value of a `style` attribute.
 *
 * @return Referenced URLs.
 */
export function getStyleURLs( style: string ): string[] {
	return Array.from(
		style.matchAll( REGEXP_STYLE_URL ),
		( [ , , url ] ) => url
	).filter( Boolean );
}

/**
 * Returns true if every meaningful attribute of the actual (stored) tag is
 * still present on the expected (generated) tag, or false if regenerating the
 * markup would drop or alter content. The generated tag may carry additional
 * attributes and presentational attribute values may differ, with these
 * constraints: every class name and style property (and every URL referenced
 * from `style`) of the stored tag must be kept, and content-bearing
 * attributes (`src`, `href`, `alt`, …) must keep their value.
 *
 * @param actual   Actual (stored) attribute tuples.
 * @param expected Expected (generated) attribute tuples.
 * @param logger   Validation logger object.
 *
 * @return Whether all stored attributes are preserved.
 */
export function areAttributesPreserved(
	actual: Array< [ string, string ] >,
	expected: Array< [ string, string ] >,
	logger: Logger = createLogger()
): boolean {
	const expectedByName = new Map(
		expected.map( ( [ name, value ] ) => [ name.toLowerCase(), value ] )
	);

	for ( const [ name, actualValue ] of actual ) {
		const nameLower = name.toLowerCase();
		if ( ! expectedByName.has( nameLower ) ) {
			logger.warning( 'Attribute `%s` would be dropped.', name );
			return false;
		}

		const expectedValue = expectedByName.get( nameLower )!;
		let dropped: string[] = [];
		if ( nameLower === 'class' ) {
			const expectedClasses =
				getTextPiecesSplitOnWhitespace( expectedValue );
			dropped = getTextPiecesSplitOnWhitespace( actualValue ).filter(
				( className ) => ! expectedClasses.includes( className )
			);
		} else if ( nameLower === 'style' ) {
			const expectedProperties = getStyleProperties( expectedValue );
			const expectedURLs = getStyleURLs( expectedValue );
			dropped = [
				...Object.keys( getStyleProperties( actualValue ) ).filter(
					( property ) =>
						! Object.hasOwn( expectedProperties, property )
				),
				...getStyleURLs( actualValue ).filter(
					( url ) => ! expectedURLs.includes( url )
				),
			];
		} else if (
			CONTENT_ATTRIBUTES.includes( nameLower ) &&
			actualValue !== expectedValue
		) {
			logger.warning(
				'Attribute `%s` value would change from `%s` to `%s`.',
				name,
				actualValue,
				expectedValue
			);
			return false;
		}

		if ( dropped.length ) {
			logger.warning(
				'Attribute `%s` values `%s` would be dropped.',
				name,
				dropped.join( ' ' )
			);
			return false;
		}
	}

	return true;
}

/**
 * Token-type-specific equality handlers which consider the structure of the
 * markup (tag names and text content) and whether the attributes of the
 * actual markup are preserved, but not whether presentational attributes are
 * added or their values changed.
 *
 * @see isEqualTokensOfType
 */
const isEqualTokenStructureOfType: Record<
	string,
	( actual: HTMLToken, expected: HTMLToken, logger?: Logger ) => boolean
> = {
	StartTag: (
		actual: HTMLToken,
		expected: HTMLToken,
		logger: Logger = createLogger()
	): boolean => {
		if (
			actual.tagName!.toLowerCase() !== expected.tagName!.toLowerCase()
		) {
			logger.warning(
				'Expected tag name `%s`, instead saw `%s`.',
				expected.tagName,
				actual.tagName
			);
			return false;
		}

		return areAttributesPreserved(
			getMeaningfulAttributePairs( actual ),
			getMeaningfulAttributePairs( expected ),
			logger
		);
	},
	Chars: isEquivalentTextTokens,
	Comment: isEquivalentTextTokens,
};

/**
 * Tokenizes two HTML strings and compares them token by token, deferring to
 * the given token-type-specific equality handlers.
 *
 * @param actual              Actual HTML string.
 * @param expected            Expected HTML string.
 * @param logger              Validation logger object.
 * @param isEqualTokensByType Token-type-specific equality handlers.
 *
 * @return Whether all tokens are equivalent.
 */
function areEquivalentHTMLTokens(
	actual: string,
	expected: string,
	logger: Logger,
	isEqualTokensByType: typeof isEqualTokensOfType
): boolean {
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
		const isEqualTokens = isEqualTokensByType[ actualToken.type ];
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
 * Returns true if the given HTML strings are effectively equivalent, or
 * false otherwise.
 *
 * @param actual   Actual HTML string.
 * @param expected Expected HTML string.
 * @param logger   Validation logger object.
 *
 * @return Whether HTML strings are equivalent.
 */
export function isEquivalentHTML(
	actual: string,
	expected: string,
	logger: Logger = createLogger()
): boolean {
	// Short-circuit if markup is identical.
	if ( actual === expected ) {
		return true;
	}

	return areEquivalentHTMLTokens(
		actual,
		expected,
		logger,
		isEqualTokensOfType
	);
}

/**
 * Returns true if the given HTML strings have an equivalent structure: the
 * same sequence of elements with the same text content, where `expected` may
 * add attributes to an element or change presentational attribute values
 * (e.g. missing class names), but never drops an attribute, class name or
 * style property that `actual` has, nor changes the value of a content-bearing
 * attribute such as `src`, `href` or `alt`.
 *
 * Unlike `isEquivalentHTML`, which stops at the first mismatch of any kind, a
 * positive result here guarantees that no element, text, attribute, class
 * name, style property or content-bearing attribute value of `actual` is
 * absent from `expected`; presentational attribute values may still differ.
 *
 * @param actual   Actual HTML string.
 * @param expected Expected HTML string.
 * @param logger   Validation logger object.
 *
 * @return Whether HTML strings are structurally equivalent.
 */
export function isEquivalentHTMLStructure(
	actual: string,
	expected: string,
	logger: Logger = createLogger()
): boolean {
	// Short-circuit if markup is identical.
	if ( actual === expected ) {
		return true;
	}

	return areEquivalentHTMLTokens(
		actual,
		expected,
		logger,
		isEqualTokenStructureOfType
	);
}

/**
 * Returns the content tokens of the given HTML, in document order: the words
 * of its text and comment nodes, followed by the values of content-bearing
 * attributes (`src`, `href`, `alt`, …, see `CONTENT_ATTRIBUTES`) and the URLs
 * referenced from `style` attributes, each prefixed with the attribute name.
 * Other attributes are not considered.
 *
 * The markup is parsed with an inert HTML document rather than tokenized, so
 * that malformed markup is interpreted the way a browser renders it (e.g. a
 * `<` which does not start a tag is text), entities are decoded, and no
 * scripts run nor resources load.
 *
 * @param html HTML string.
 *
 * @return Content tokens.
 */
export function getContentTokens( html: string ): string[] {
	const doc = document.implementation.createHTMLDocument( '' );
	doc.body.innerHTML = html;

	// Collect the words of each text node separately, since adjacent text
	// nodes (e.g. of sibling elements) are not separated by whitespace.
	// Comments carry content too, e.g. the custom text of a "more" block.
	const tokens: string[] = [];
	const walker = doc.createTreeWalker(
		doc.body,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT // eslint-disable-line no-bitwise
	);
	while ( walker.nextNode() ) {
		const words = ( walker.currentNode as CharacterData ).data
			.split( /\s+/ )
			.filter( Boolean );
		tokens.push( ...words );
	}

	const selector = [ ...CONTENT_ATTRIBUTES, 'style' ]
		.map( ( name ) => `[${ name }]` )
		.join( ',' );
	for ( const element of doc.body.querySelectorAll( selector ) ) {
		for ( const name of CONTENT_ATTRIBUTES ) {
			const value = element.getAttribute( name )?.trim();
			if ( value ) {
				tokens.push( `${ name }=${ value }` );
			}
		}
		for ( const url of getStyleURLs(
			element.getAttribute( 'style' ) ?? ''
		) ) {
			tokens.push( `url=${ url }` );
		}
	}

	return tokens;
}

/**
 * Returns true if every content token of the original HTML (see
 * `getContentTokens`) is also present in the generated HTML, or false if
 * regenerating the content would drop text, media or links.
 *
 * Additional content in the generated markup is acceptable (e.g. labels
 * rendered from attributes); missing content is not. Tokens are compared as a
 * multiset, so repeated words or images must be present as many times.
 *
 * @example
 * ```js
 * isContentPreserved( '<h3>Title</h3>', '<h2 class="wp-block-heading">Title</h2>' ); // true
 * isContentPreserved( '<h2>Title</h2><p>Intro</p>', '<h2>Title</h2>' ); // false
 * isContentPreserved( '<img src="a.png"/><img src="b.png"/>', '<figure><img src="a.png"/></figure>' ); // false
 * ```
 *
 * @param original  Original HTML string.
 * @param generated Generated HTML string.
 * @param logger    Validation logger object.
 *
 * @return Whether all content is preserved.
 */
export function isContentPreserved(
	original: string,
	generated: string,
	logger: Logger = createQueuedLogger()
): boolean {
	const originalTokens = getContentTokens( original );
	if ( originalTokens.length === 0 ) {
		return true;
	}

	const availableTokens = new Map< string, number >();
	for ( const token of getContentTokens( generated ) ) {
		availableTokens.set( token, ( availableTokens.get( token ) ?? 0 ) + 1 );
	}

	const missingToken = originalTokens.find( ( token ) => {
		const count = availableTokens.get( token );
		if ( ! count ) {
			return true;
		}
		availableTokens.set( token, count - 1 );
		return false;
	} );

	if ( missingToken !== undefined ) {
		logger.warning(
			'Content `%s` is not present in the generated markup.',
			missingToken
		);
		return false;
	}

	return true;
}

/**
 * Returns validation results for a parsed block. Validation classifies the
 * block's content integrity into one of the `VALIDATION_LEVEL` levels, from a
 * perfect match (`VALID_BLOCK`) to requiring user intervention
 * (`INVALID_BLOCK`).
 *
 * A block is considered valid when its content can be regenerated from its
 * attributes without losing anything meaningful: the `save` output either
 * matches the stored content, only adds attributes to it, or differs
 * structurally while preserving all of its text, media and links. Block types
 * can opt out of the latter two with `allowsReconstruction: false`.
 *
 * Note: `MIGRATED_BLOCK` (Level 1) is assigned by the parser when a block
 * deprecation matches, not by this function.
 *
 * @param block           Block object.
 * @param blockTypeOrName Block type or name, inferred from block if not given.
 *
 * @return Validation results tuple: whether the block is valid, the
 *         validation issues found by the strict comparison (empty for an
 *         exact match), and metadata with the validation level and the
 *         original and generated content.
 */
export function validateBlock(
	block: Block,
	blockTypeOrName: BlockType | string = block.name
): [ boolean, LoggerItem[], ValidationMetadata ] {
	// Freeform content and the unregistered block handler preserve their raw
	// HTML as-is, so there is nothing to compare: they are always valid.
	if (
		block.name === getFreeformContentHandlerName() ||
		block.name === getUnregisteredTypeHandlerName()
	) {
		return [
			true,
			[],
			{
				validationLevel: VALIDATION_LEVEL.VALID_BLOCK,
				originalContent: block.originalContent,
				generatedContent: block.originalContent,
			},
		];
	}

	const logger = createQueuedLogger();
	const blockType = normalizeBlockType( blockTypeOrName );
	const originalContent = block.originalContent ?? '';

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
				generatedContent: undefined,
			},
		];
	}

	// Run the block's `save` with the parsed attributes to generate the
	// expected HTML, which is compared against the content stored in the post.
	let generatedBlockContent: string;
	try {
		generatedBlockContent = getSaveContent( blockType, block.attributes );
	} catch ( error ) {
		// If `save` throws, the block cannot be regenerated at all.
		logger.error(
			'Block validation failed because an error occurred while generating block content:\n\n%s',
			( error as Error ).toString()
		);

		return [
			false,
			logger.getItems(),
			{
				validationLevel: VALIDATION_LEVEL.INVALID_BLOCK,
				originalContent: block.originalContent,
				generatedContent: undefined,
			},
		];
	}

	const result = (
		isValid: boolean,
		validationLevel: ValidationLevel
	): [ boolean, LoggerItem[], ValidationMetadata ] => [
		isValid,
		logger.getItems(),
		{
			validationLevel,
			originalContent: block.originalContent,
			generatedContent: generatedBlockContent,
		},
	];

	// Level 0 (ValidBlock): the `save` output is equivalent to the stored
	// content, i.e. saving the block again is an idempotent operation.
	if ( isEquivalentHTML( originalContent, generatedBlockContent, logger ) ) {
		return result( true, VALIDATION_LEVEL.VALID_BLOCK );
	}

	// Block types can opt out of any automatic reconstruction, in which case
	// only an exact match (or a deprecation, handled by the parser) is
	// acceptable. The comparisons below share the logger, so that the issues
	// explain why a block was regenerated rather than reconstructed, or why
	// it could not be regenerated at all.
	const allowsReconstruction = blockType.allowsReconstruction !== false;

	// Level 2 (ReconstructedBlock): the stored content has the same elements,
	// text and content-bearing attributes as the `save` output, which only
	// adds attributes or changes presentational values, such as class names
	// generated from attributes being absent. Regenerating the block only
	// adds to its markup.
	if (
		allowsReconstruction &&
		isEquivalentHTMLStructure(
			originalContent,
			generatedBlockContent,
			logger
		)
	) {
		return result( true, VALIDATION_LEVEL.RECONSTRUCTED_BLOCK );
	}

	// Level 3 (RegeneratedBlock): the structure differs (wrong tags, malformed
	// or extraneous markup, unmodelled attributes), but all of the content of
	// the stored markup (text, media and links) is present in the `save`
	// output, so regenerating the block from its attributes rewrites the
	// markup without dropping what the user wrote.
	if (
		allowsReconstruction &&
		isContentPreserved( originalContent, generatedBlockContent, logger )
	) {
		return result( true, VALIDATION_LEVEL.REGENERATED_BLOCK );
	}

	// Level 4 (InvalidBlock): regenerating the block would lose content, or
	// the block type opted out of reconstruction. The block is marked invalid
	// so that its original HTML is preserved untouched.
	logger.error(
		'Block validation failed for `%s` (%o).\n\nContent generated by `save` function:\n\n%s\n\nContent retrieved from post body:\n\n%s',
		blockType.name,
		blockType,
		generatedBlockContent,
		block.originalContent
	);

	return result( false, VALIDATION_LEVEL.INVALID_BLOCK );
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
 * @param      blockTypeOrName      Block type.
 * @param      attributes           Parsed block attributes.
 * @param      originalBlockContent Original block content.
 *
 * @return Whether block is valid.
 */
export function isValidBlockContent(
	blockTypeOrName: BlockType | string,
	attributes: Record< string, unknown >,
	originalBlockContent: string
): boolean {
	deprecated( 'isValidBlockContent introduces opportunity for data loss', {
		since: '12.6',
		plugin: 'Gutenberg',
		alternative: 'validateBlock',
	} );

	const blockType = normalizeBlockType( blockTypeOrName );
	const block = {
		clientId: '',
		name: blockType!.name,
		isValid: true,
		attributes,
		innerBlocks: [],
		originalContent: originalBlockContent,
	};
	const [ isValid ] = validateBlock( block, blockType! );

	return isValid;
}
