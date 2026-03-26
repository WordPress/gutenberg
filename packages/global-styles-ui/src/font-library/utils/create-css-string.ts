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
 * const fontName = "A font's <problem>";
 * const fontFaceRule = `@font-face { font-family: ${createCssString(fontName)}; }`
 * ```
 *
 * `fontFaceRule` will have the value `'@font-face { font-family: "A font\\27 s \\3C problem\\3E "; }'`.
 * The browser will parse this rule as equivalent to: `@font-face { font-family: "A font's <problem>"; }`.
 *
 * Some characters that are valid in CSS strings are escaped to avoid problems with subsequent
 * processing that may not correctly parse CSS:
 *
 * - "<", ">", and "&" are replaced to prevent issues with KSES and other sanitization that
 *   is confused by HTML-like text.
 * - CSS syntax characters are replaced to prevent issues where CSS may be processed by simple
 *   string splits or search and replaces: "',;{}
 * - Plain "\" backslashes are escaped.
 *
 * @param value The JavaScript string to serialize as a quoted CSS string.
 * @return A quoted, CSS-safe font-family string.
 */
export function createCssString( value: string ): string {
	return `"${ value
		/*
		 * CSS Unicode escaping for problematic characters.
		 * https://www.w3.org/TR/css-syntax-3/#escaping
		 *
		 * Note that the Unicode escape sequences are used rather than backslash-escaping so the
		 * problematic characters are removed completely. CSS Unicode escapes are formed by a
		 * "\" followed by the character code in hexadecimal. The escape may be terminated by
		 * whitespace which is ignored.
		 */
		// Escape existing backslashes before any other processing.
		.replaceAll( '\\', '\\5C ' )

		// Pre-processing replaces NULLs and some newlines. Replace and escape as necessary.
		.replaceAll( '\0', '\uFFFD' )

		// Normalize and replace newlines. https://www.w3.org/TR/css-syntax-3/#input-preprocessing
		.replaceAll( '\r\n', '\\A ' )
		.replaceAll( '\r', '\\A ' )
		.replaceAll( '\f', '\\A ' )

		// Newlines must be escaped.
		.replaceAll( '\n', '\\A ' )

		// HTML syntax may be problematic.
		.replaceAll( '<', '\\3C ' )
		.replaceAll( '>', '\\3E ' )
		.replaceAll( '&', '\\26 ' )

		// CSS syntax may be problematic.
		.replaceAll( ',', '\\2C ' )
		.replaceAll( ';', '\\3B ' )
		.replaceAll( '{', '\\7B ' )
		.replaceAll( '}', '\\7D ' )
		.replaceAll( '"', '\\22 ' )
		.replaceAll( "'", '\\27 ' ) }"`;
}
