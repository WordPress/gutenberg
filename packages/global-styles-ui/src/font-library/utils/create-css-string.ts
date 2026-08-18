/*
 * Characters kept literal: ASCII letters, digits, "-", "_", and everything
 * above U+007F. Every other character is escaped, for two reasons:
 *
 * - The value must be a fixed point of server-side sanitization
 *   (`WP_Font_Utils::sanitize_font_family()`, which applies
 *   `sanitize_text_field()`): no literal whitespace (runs collapse and the
 *   ends trim), no "<" (tag stripping), no "%" (percent-encoded octet
 *   stripping), no ",", ";", or quotes (list splitting and re-quoting).
 * - When printing `@font-face` rules, core's `WP_Font_Face_Resolver` strips
 *   the surrounding quotes and `WP_Font_Face` only re-adds them when the
 *   value contains a literal space, so the value is also parsed as an
 *   UNQUOTED identifier sequence. Only identifier-safe characters may
 *   appear as literals or the rule is silently dropped.
 */
const ESCAPED_CHARACTER_PATTERN = /\r\n|[^A-Za-z0-9_\u{0080}-\u{10FFFF}-]/gu;

function escapeCharacter( character: string ): string {
	// The newline forms are normalized to the LF escape, matching CSS input
	// preprocessing. https://www.w3.org/TR/css-syntax-3/#input-preprocessing
	if ( character === '\r\n' || character === '\r' || character === '\f' ) {
		character = '\n';
	}
	return (
		'\\' +
		character
			.codePointAt( 0 )!
			.toString( 16 )
			.toUpperCase()
			.padStart( 6, '0' )
	);
}

/**
 * Construct a quoted CSS String from a plain JavaScript value.
 *
 * A plain JavaScript string will be transformed to a quoted CSS string suitable for interpolation
 * in CSS text.
 *
 * The input is not trimmed. Trim should be performed before calling this method, if desired.
 *
 * @example
 * ```js
 * const fontName = 'CSS & a "<style>" tag\'s strings';
 * const fontFaceRule = `@font-face { font-family: ${createCssString(fontName)}; }`
 * ```
 *
 * `fontFaceRule` will have the value
 * `'@font-face { font-family: "CSS\\000020\\000026\\000020a\\000020\\000022\\00003Cstyle\\00003E\\000022\\000020tag\\000027s\\000020strings"; }'`.
 * The browser will parse this rule as equivalent to: `@font-face { font-family: "CSS & a \"<style>\" tag's strings"; }`.
 *
 * Escape sequences use the fixed six-digit form (`\XXXXXX`) with no
 * whitespace terminator. The escaped content is BOTH a valid CSS string and
 * a valid CSS identifier sequence that decode to the same name: WordPress
 * stores the value byte-identically (it is a fixed point of
 * `WP_Font_Utils::sanitize_font_family()`), and the server-side `@font-face`
 * printer re-emits it without the surrounding quotes, where an
 * identifier-invalid literal would make browsers silently drop the rule.
 *
 * @param value The JavaScript string to serialize as a quoted CSS string.
 * @return A quoted CSS string suitable for interpolation in CSS text.
 */
export function createCssString( value: string ): string {
	let escaped = value
		// NULL is replaced with U+FFFD, matching CSS input preprocessing.
		.replaceAll( '\0', '�' )
		.replace( ESCAPED_CHARACTER_PATTERN, escapeCharacter );

	// An identifier sequence cannot start with a digit, or with "-" followed
	// by a digit (or standing alone); escape the leading character so the
	// unquoted form stays valid.
	if ( /^[0-9]/.test( escaped ) || /^-($|[0-9])/.test( escaped ) ) {
		escaped = escapeCharacter( escaped[ 0 ] ) + escaped.slice( 1 );
	}

	return `"${ escaped }"`;
}
