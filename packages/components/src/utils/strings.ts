/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

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
 * Escapes the RegExp special characters.
 *
 * @param {string} string Input string.
 *
 * @return {string} Regex-escaped string.
 */
export function escapeRegExp( string: string ): string {
	return string.replace( /[\\^$.*+?()[\]{}|]/g, '\\$&' );
}
