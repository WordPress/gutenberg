import { removeAccents } from './remove-accents';

/**
 * Strips HTML tags like PHP's `strip_tags()`: a `<` not followed by ASCII
 * whitespace opens a tag, even an unclosed one, nested `<` need as many `>`,
 * a `>` inside quotes doesn't close a tag, and a comment ends at `-->`.
 *
 * @param string The string to process.
 *
 * @return The string without HTML tags.
 */
function stripTags( string: string ): string {
	let result = '';
	let depth = 0;
	let quote = '';
	for ( let i = 0; i < string.length; i++ ) {
		const char = string[ i ];
		if ( depth === 0 ) {
			// Like PHP's `isspace()`, only ASCII whitespace keeps a `<`.
			if (
				char === '<' &&
				! /[ \t\n\v\f\r]/.test( string[ i + 1 ] ?? '' )
			) {
				// A comment only ends at `-->`, or at the end of the string.
				if ( string.startsWith( '<!--', i ) ) {
					const end = string.indexOf( '-->', i + 2 );
					if ( end === -1 ) {
						break;
					}
					i = end + 2;
				} else {
					depth = 1;
				}
			} else {
				result += char;
			}
		} else if ( quote ) {
			if ( char === quote ) {
				quote = '';
			}
		} else if ( char === '"' || char === "'" ) {
			quote = char;
		} else if ( char === '<' ) {
			depth++;
		} else if ( char === '>' ) {
			depth--;
		}
	}
	return result;
}

/**
 * Truncates a string like PHP's `utf8_uri_encode()` with a length: keeps the
 * characters whose percent-encoded form fits in the length, counting each
 * ASCII character as one and any other character as three per UTF-8 byte,
 * without splitting a character.
 *
 * @param string The string to process.
 * @param length The maximum length of the percent-encoded string.
 *
 * @return The truncated string.
 */
function truncateEncoded( string: string, length: number ): string {
	let result = '';
	let encodedLength = 0;
	for ( const char of string ) {
		const codePoint = char.codePointAt( 0 ) ?? 0;
		let charLength = 12;
		if ( codePoint < 0x80 ) {
			charLength = 1;
		} else if ( codePoint < 0x800 ) {
			charLength = 6;
		} else if ( codePoint < 0x10000 ) {
			charLength = 9;
		}
		if ( encodedLength + charLength > length ) {
			break;
		}
		result += char;
		encodedLength += charLength;
	}
	return result;
}

/**
 * Performs some basic cleanup of a string for use as a post slug.
 *
 * This replicates what `sanitize_title()` does in WordPress core when saving
 * a post, without the `sanitize_title` filters and the locale-specific
 * transliterations of `remove_accents()`, so it can only approximate what the
 * slug will be. It works on decoded characters, while WordPress returns the
 * slug percent-encoded, and keeps percent-encoded octets as they are. Like
 * WordPress, it keeps what fits in 200 percent-encoded characters.
 *
 * Converts accented letters to basic Latin letters, and strips HTML tags and
 * entities. Converts spaces, periods, forward slashes, dashes and wide spaces
 * to hyphens. Strips the punctuation
 * and invisible characters WordPress strips, and any other ASCII character
 * that isn't a letter, a number, an underscore or a hyphen. Keeps other
 * characters, such as letters of other scripts and emoji. Converts the
 * string to lowercase.
 *
 * @param string Title or slug to be processed.
 *
 * @return Processed string.
 */
export function cleanForSlug( string: string ): string {
	if ( ! string ) {
		return '';
	}
	const lowercase = stripTags( removeAccents( string ) )
		// Remove percent signs that aren't part of an octet.
		.replace( /%(?![0-9a-fA-F]{2})/g, '' )
		.toLowerCase();
	return (
		// Like WordPress, keep what fits in 200 percent-encoded characters,
		// the length of the slug column.
		truncateEncoded( lowercase, 200 )
			// Convert &nbsp, non-breaking hyphens, &ndash, &mdash and their HTML
			// entities, and forward slashes to hyphens.
			.replace( /[\u00a0\u2011\u2013\u2014/]/g, '-' )
			.replace(
				/&nbsp;|&#8209;|&#160;|&ndash;|&#8211;|&mdash;|&#8212;/g,
				'-'
			)
			// Strip soft hyphens, &iexcl and &iquest, angle and curly quotes,
			// bullets, &copy, &reg, &deg, &hellip, &trade, accents, and
			// invisible characters without a width.
			.replace(
				/[\u00ad\u00a1\u00bf\u00ab\u00bb\u2039\u203a\u2018-\u201f\u2022\u00a9\u00ae\u00b0\u2026\u2122\u00b4\u02ca\u0301\u0341\u0300\u0304\u030c\u200b-\u200f\u202a-\u202e\ufeff\ufffc]/g,
				''
			)
			// Convert invisible characters with a width to hyphens.
			.replace( /[\u2000-\u200a\u2028\u2029\u202f]/g, '-' )
			// Convert &times to 'x'.
			.replace( /\u00d7/g, 'x' )
			// Remove HTML entities.
			.replace( /&.+?;/g, '' )
			.replace( /\./g, '-' )
			// Remove any ASCII character that isn't a letter, number, space,
			// underscore, hyphen or the percent sign of an octet.
			.replace( /[^%a-z0-9 _\-\u0080-\uffff]/g, '' )
			// Convert spaces to hyphens.
			.replace( / +/g, '-' )
			// Replace multiple hyphens with a single one.
			.replace( /-+/g, '-' )
			// Remove any remaining leading or trailing hyphens.
			.replace( /(^-+)|(-+$)/g, '' )
	);
}
