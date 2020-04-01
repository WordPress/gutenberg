/**
 * List of translation functions exposed by the `@wordpress/i18n` package.
 *
 * @type {Set<string>} Translation functions.
 */
const TRANSLATION_FUNCTIONS = new Set( [ '__', '_x', '_n', '_nx' ] );

/**
 * Regular expression matching the presence of a printf format string
 * placeholder.
 *
 * Originally copied from http://php.net/manual/en/function.sprintf.php#93552.
 *
 * @see https://github.com/WordPress/WordPress-Coding-Standards/blob/2f927b0ba2bfcbffaa8f3251c086e109302d6622/WordPress/Sniffs/WP/I18nSniff.php#L37-L60
 *
 * @type {RegExp}
 */
const REGEXP_SPRINTF_PLACEHOLDER = /(?:(?<!%)(%(?:[0-9]+\$)?[+-]?(?:(?:0|\'.)?-?[0-9]*(?:\.(?:[ 0]|\'.)?[0-9]+)?|(?:[ ])?-?[0-9]+(?:\.(?:[ 0]|\'.)?[0-9]+)?)[bcdeEfFgGosuxX]))/g;

/**
 * "Unordered" means there's no position specifier: '%s', not '%2$s'.
 *
 * @see https://github.com/WordPress/WordPress-Coding-Standards/blob/2f927b0ba2bfcbffaa8f3251c086e109302d6622/WordPress/Sniffs/WP/I18nSniff.php#L62-L81
 *
 * @type {RegExp}
 */
const REGEXP_SPRINTF_PLACEHOLDER_UNORDERED = /(?:(?<!%)%[+-]?(?:(?:0|'.)?-?[0-9]*(?:\.(?:[ 0]|'.)?[0-9]+)?|(?:[ ])?-?[0-9]+(?:\.(?:[ 0]|'.)?[0-9]+)?)[bcdeEfFgGosuxX])/;

module.exports = {
	TRANSLATION_FUNCTIONS,
	REGEXP_SPRINTF_PLACEHOLDER,
	REGEXP_SPRINTF_PLACEHOLDER_UNORDERED,
};
