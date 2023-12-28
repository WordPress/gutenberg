/**
 * External dependencies
 */
import removeAccents from 'remove-accents';
import { paramCase } from 'change-case';

const ALL_UNICODE_DASH_CHARACTERS = new RegExp(
	`[${ [
		// - (hyphen-minus)
		'\u002d',
		// ~ (tilde)
		'\u007e',
		// ­ (soft hyphen)
		'\u00ad',
		// ֊ (armenian hyphen)
		'\u058a',
		// ־ (hebrew punctuation maqaf)
		'\u05be',
		// ᐀ (canadian syllabics hyphen)
		'\u1400',
		// ᠆ (mongolian todo soft hyphen)
		'\u1806',
		// ‐ (hyphen)
		'\u2010',
		// non-breaking hyphen)
		'\u2011',
		// ‒ (figure dash)
		'\u2012',
		// – (en dash)
		'\u2013',
		// — (em dash)
		'\u2014',
		// ― (horizontal bar)
		'\u2015',
		// ⁓ (swung dash)
		'\u2053',
		// superscript minus)
		'\u207b',
		// subscript minus)
		'\u208b',
		// − (minus sign)
		'\u2212',
		// ⸗ (double oblique hyphen)
		'\u2e17',
		// ⸺ (two-em dash)
		'\u2e3a',
		// ⸻ (three-em dash)
		'\u2e3b',
		// 〜 (wave dash)
		'\u301c',
		// 〰 (wavy dash)
		'\u3030',
		// ゠ (katakana-hiragana double hyphen)
		'\u30a0',
		// ︱ (presentation form for vertical em dash)
		'\ufe31',
		// ︲ (presentation form for vertical en dash)
		'\ufe32',
		// ﹘ (small em dash)
		'\ufe58',
		// ﹣ (small hyphen-minus)
		'\ufe63',
		// － (fullwidth hyphen-minus)
		'\uff0d',
	].join( '' ) }]`,
	'g'
);

export const normalizeTextString = ( value: string ): string => {
	return removeAccents( value )
		.toLocaleLowerCase()
		.replace( ALL_UNICODE_DASH_CHARACTERS, '-' );
};

/**
 * Converts any string to kebab case.
 * Backwards compatible with Lodash's `_.kebabCase()`.
 * Backwards compatible with `_wp_to_kebab_case()`.
 *
 * @see https://lodash.com/docs/4.17.15#kebabCase
 * @see https://developer.wordpress.org/reference/functions/_wp_to_kebab_case/
 *
 * @param str String to convert.
 * @return Kebab-cased string
 */
export function kebabCase( str: unknown ) {
	let input = str?.toString?.() ?? '';

	// See https://github.com/lodash/lodash/blob/b185fcee26b2133bd071f4aaca14b455c2ed1008/lodash.js#L4970
	input = input.replace( /['\u2019]/, '' );

	return paramCase( input, {
		splitRegexp: [
			/(?!(?:1ST|2ND|3RD|[4-9]TH)(?![a-z]))([a-z0-9])([A-Z])/g, // fooBar => foo-bar, 3Bar => 3-bar
			/(?!(?:1st|2nd|3rd|[4-9]th)(?![a-z]))([0-9])([a-z])/g, // 3bar => 3-bar
			/([A-Za-z])([0-9])/g, // Foo3 => foo-3, foo3 => foo-3
			/([A-Z])([A-Z][a-z])/g, // FOOBar => foo-bar
		],
	} );
}

/**
 * Escapes the RegExp special characters.
 *
 * @param string Input string.
 *
 * @return Regex-escaped string.
 */
export function escapeRegExp( string: string ): string {
	return string.replace( /[\\^$.*+?()[\]{}|]/g, '\\$&' );
}
