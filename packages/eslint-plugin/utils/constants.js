/**
 * List of translation functions exposed by the `@wordpress/i18n` package.
 *
 * @type {Set<string>} Translation functions.
 */
const TRANSLATION_FUNCTIONS = new Set( [ '__', '_x', '_n', '_nx' ] );

/**
 * Regular expression matching format placeholder syntax.
 *
 * The pattern for matching named arguments is a naive and incomplete matcher
 * against valid JavaScript identifier names.
 *
 * via Mathias Bynens:
 *
 * >An identifier must start with $, _, or any character in the Unicode
 * >categories “Uppercase letter (Lu)”, “Lowercase letter (Ll)”, “Titlecase
 * >letter (Lt)”, “Modifier letter (Lm)”, “Other letter (Lo)”, or “Letter
 * >number (Nl)”.
 * >
 * >The rest of the string can contain the same characters, plus any U+200C zero
 * >width non-joiner characters, U+200D zero width joiner characters, and
 * >characters in the Unicode categories “Non-spacing mark (Mn)”, “Spacing
 * >combining mark (Mc)”, “Decimal digit number (Nd)”, or “Connector
 * >punctuation (Pc)”.
 *
 * If browser support is constrained to those supporting ES2015, this could be
 * made more accurate using the `u` flag:
 *
 * ```
 * /^[$_\p{L}\p{Nl}][$_\p{L}\p{Nl}\u200C\u200D\p{Mn}\p{Mc}\p{Nd}\p{Pc}]*$/u;
 * ```
 *
 * @see http://www.pixelbeat.org/programming/gcc/format_specs.html
 * @see https://mathiasbynens.be/notes/javascript-identifiers#valid-identifier-names
 *
 * @type {RegExp}
 */
const REGEXP_SPRINTF_PLACEHOLDER =
	/(?<!%)%(((\d+)\$)|(\(([$_a-zA-Z][$_a-zA-Z0-9]*)\)))?[ +0#-]*\d*(\.(\d+|\*))?(ll|[lhqL])?([cduxXefgsp])/g;
//               	  ▲         ▲                    ▲       ▲  ▲            ▲           ▲ type
//               	  │         │                    │       │  │            └ Length (unsupported)
//               	  │         │                    │       │  └ Precision / max width
//               	  │         │                    │       └ Min width (unsupported)
//               	  │         │                    └ Flags (unsupported)
//               	  └ Index   └ Name (for named arguments)

/**
 * "Unordered" means there's no position specifier: '%s', not '%2$s'.
 *
 * @see https://github.com/WordPress/WordPress-Coding-Standards/blob/2f927b0ba2bfcbffaa8f3251c086e109302d6622/WordPress/Sniffs/WP/I18nSniff.php#L62-L81
 *
 * @type {RegExp}
 */
const REGEXP_SPRINTF_PLACEHOLDER_UNORDERED =
	/(?:(?<!%)%[+-]?(?:(?:0|'.)?-?[0-9]*(?:\.(?:[ 0]|'.)?[0-9]+)?|(?:[ ])?-?[0-9]+(?:\.(?:[ 0]|'.)?[0-9]+)?)[bcdeEfFgGosuxX])/;

/**
 * Regular expression to extract placeholder keys from translator comments.
 *
 * It matches common i18n placeholders and comment-only keys, with optional
 * precision and a trailing colon (indicating a description).
 *
 * Breakdown of the regex:
 *```md
 * (?:^|\s|,)       — Non-capturing group that matches the start of the string, a whitespace character, or a comma (ensures proper separation).
 *
 * \s*              — Optional whitespace after the separator.
 *
 * (                — Capturing group for the full placeholder (used as key):
 *   %?             — Optional `%` to allow bare keys like `1`, `label` in comments.
 *   (              — Group for matching placeholder variants:
 *     \(?<named>[a-zA-Z_][a-zA-Z0-9_]*\)        — Named placeholder in the form: %(name)
 *     (?:\.\d+|\.\*)?                           — Optional precision: .2 or .*
 *     [sdf]                                     — Format specifier: s, d, or f
 *
 *     |
 *     (?<positional>[1-9][0-9]*)\$?             — Positional placeholder like %1$
 *     (?:\.\d+|\.\*)?                           — Optional precision
 *     [sdf]                                     — Format specifier
 *
 *     |                                         — OR
 *     (?:\.\d+|\.\*)?[sdf]                      — Unnamed placeholder with optional precision
 *
 *     | [1-9][0-9]*                             — Bare positional key like `1`, `2`
 *     | [sdf]                                   — Just a format type
 *     | [a-zA-Z_][a-zA-Z0-9_]*                  — Bare named key (used in comments)
 *   )
 * )
 *
 * (?<colon>:[ \t]+)? — Optional named group `colon`, matches a colon followed by space or tab,
 *                      indicating that this placeholder has a description in the comment.
 *
 * Flags:
 * g — global, so it matches all placeholders in the comment string.
 * ```
 */
const REGEXP_COMMENT_PLACEHOLDER =
	/(?:^|\s|,)\s*(%?(?:\((?<named>[a-zA-Z_][a-zA-Z0-9_]*)\)(?:\.\d+|\.\*)?[sdf]|(?<positional>[1-9][0-9]*)\$?(?:\.\d+|\.\*)?[sdf]|(?:\.\d+|\.\*)?[sdf]|[1-9][0-9]*|[sdf]|[a-zA-Z_][a-zA-Z0-9_]*))(?<colon>:[ \t]+)?/g;

module.exports = {
	TRANSLATION_FUNCTIONS,
	REGEXP_SPRINTF_PLACEHOLDER,
	REGEXP_SPRINTF_PLACEHOLDER_UNORDERED,
	REGEXP_COMMENT_PLACEHOLDER,
};
