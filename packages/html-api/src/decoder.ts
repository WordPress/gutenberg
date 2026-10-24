import namedCharacterReferences from './named-character-references';

/**
 * Where a character reference appears. Attribute values follow stricter rules
 * for named references without a trailing semicolon.
 */
export type DecodingContext = 'attribute' | 'data';

// Longest name in the table, `CounterClockwiseContourIntegral;`.
const LONGEST_NAME_LENGTH = 32;

// Code points 0x80 to 0x9F are read as Windows-1252, as the spec requires.
const WINDOWS_1252_MAPPING = [
	0x20ac, 0x81, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6,
	0x2030, 0x0160, 0x2039, 0x0152, 0x8d, 0x017d, 0x8f, 0x90, 0x2018, 0x2019,
	0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a,
	0x0153, 0x9d, 0x017e, 0x0178,
];

/**
 * Returns the length of the initial run of characters in `text`, from `at`,
 * that are all in `characters`. Mirrors PHP's `strspn()`.
 *
 * @param text       Text to scan.
 * @param characters Allowed characters.
 * @param at         Offset to start at.
 * @param maxLength  Most characters to scan.
 */
export function strspn(
	text: string,
	characters: string,
	at: number,
	maxLength: number = Infinity
): number {
	const end = Math.min( text.length, at + maxLength );
	let i = at;
	while ( i < end && characters.includes( text[ i ] ) ) {
		i++;
	}
	return Math.max( 0, i - at );
}

/**
 * Returns the length of the initial run of characters in `text`, from `at`,
 * that are not in `characters`. Mirrors PHP's `strcspn()`.
 *
 * @param text       Text to scan.
 * @param characters Stop characters.
 * @param at         Offset to start at.
 * @param maxLength  Most characters to scan.
 */
export function strcspn(
	text: string,
	characters: string,
	at: number,
	maxLength: number = Infinity
): number {
	const end = Math.min( text.length, at + maxLength );
	let i = at;
	while ( i < end && ! characters.includes( text[ i ] ) ) {
		i++;
	}
	return Math.max( 0, i - at );
}

/**
 * Returns the character for a code point, or U+FFFD when there is none.
 *
 * @param codePoint Code point.
 */
function codePointToString( codePoint: number ): string {
	if (
		codePoint > 0x10ffff ||
		( codePoint >= 0xd800 && codePoint <= 0xdfff )
	) {
		return '�';
	}
	return String.fromCodePoint( codePoint );
}

/**
 * Reads the character reference at `at` in `text`, if there is one.
 *
 * @param context Where the text appears.
 * @param text    Text containing the reference.
 * @param at      Offset of the `&`.
 *
 * @return The decoded text and the length of the reference, or `null`.
 */
export function readCharacterReference(
	context: DecodingContext,
	text: string,
	at = 0
): { text: string; length: number } | null {
	const length = text.length;
	if ( at + 1 >= length || '&' !== text[ at ] ) {
		return null;
	}

	if ( '#' === text[ at + 1 ] ) {
		if ( at + 2 >= length ) {
			return null;
		}

		let digitsAt = at + 2;
		let numericBase = 10;
		let numericDigits = '0123456789';
		let maxDigits = 7; // &#1114111;
		if ( 'x' === text[ digitsAt ] || 'X' === text[ digitsAt ] ) {
			numericBase = 16;
			numericDigits = '0123456789abcdefABCDEF';
			maxDigits = 6; // &#x10FFFF;
			++digitsAt;
		}

		const zeroCount = strspn( text, '0', digitsAt );
		const digitCount = strspn( text, numericDigits, digitsAt + zeroCount );
		const afterDigits = digitsAt + zeroCount + digitCount;
		const hasSemicolon =
			afterDigits < length && ';' === text[ afterDigits ];
		const endOfSpan = hasSemicolon ? afterDigits + 1 : afterDigits;

		if ( 0 === digitCount && 0 === zeroCount ) {
			return null;
		}

		if ( 0 === digitCount || digitCount > maxDigits ) {
			return { text: '�', length: endOfSpan - at };
		}

		let codePoint = parseInt(
			text.substr( digitsAt + zeroCount, digitCount ),
			numericBase
		);
		if ( codePoint >= 0x80 && codePoint <= 0x9f ) {
			codePoint = WINDOWS_1252_MAPPING[ codePoint - 0x80 ];
		}

		return { text: codePointToString( codePoint ), length: endOfSpan - at };
	}

	const nameAt = at + 1;
	if ( nameAt + 2 > length ) {
		return null;
	}

	// Find the longest name that matches.
	let nameLength = Math.min( LONGEST_NAME_LENGTH, length - nameAt );
	let replacement: string | undefined;
	for ( ; nameLength > 0; nameLength-- ) {
		replacement = Object.hasOwn(
			namedCharacterReferences,
			text.substr( nameAt, nameLength )
		)
			? namedCharacterReferences[ text.substr( nameAt, nameLength ) ]
			: undefined;
		if ( undefined !== replacement ) {
			break;
		}
	}
	if ( undefined === replacement ) {
		return null;
	}

	const afterName = nameAt + nameLength;
	if (
		'attribute' !== context ||
		';' === text[ afterName - 1 ] ||
		afterName >= length
	) {
		return { text: replacement, length: afterName - at };
	}

	// In attributes, a reference without a semicolon followed by `=` or an
	// alphanumeric character is left as plain text.
	if ( /[=0-9A-Za-z]/.test( text[ afterName ] ) ) {
		return null;
	}

	return { text: replacement, length: afterName - at };
}

/**
 * Decodes the character references in a text node or attribute value.
 *
 * @param context Where the text appears.
 * @param text    Text with character references.
 */
export function decode( context: DecodingContext, text: string ): string {
	let decoded = '';
	const end = text.length;
	let at = 0;
	let wasAt = 0;

	while ( at < end ) {
		const nextCharacterReferenceAt = text.indexOf( '&', at );
		if ( -1 === nextCharacterReferenceAt ) {
			break;
		}

		const characterReference = readCharacterReference(
			context,
			text,
			nextCharacterReferenceAt
		);
		if ( characterReference ) {
			at = nextCharacterReferenceAt;
			decoded += text.slice( wasAt, at );
			decoded += characterReference.text;
			at += characterReference.length;
			wasAt = at;
			continue;
		}

		at = nextCharacterReferenceAt + 1;
	}

	if ( 0 === wasAt ) {
		return text;
	}

	return decoded + text.slice( wasAt );
}

/**
 * Decodes the character references in a text node.
 *
 * @param text Text node content.
 */
export function decodeTextNode( text: string ): string {
	return decode( 'data', text );
}

/**
 * Decodes the character references in an attribute value.
 *
 * @param text Raw attribute value.
 */
export function decodeAttribute( text: string ): string {
	return decode( 'attribute', text );
}
