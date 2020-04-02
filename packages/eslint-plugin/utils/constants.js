/**
 * List of translation functions exposed by the `@wordpress/i18n` package.
 *
 * @type {Set<string>} Translation functions.
 */
const TRANSLATION_FUNCTIONS = new Set( [ '__', '_x', '_n', '_nx' ] );

/**
 * Regular expression matching the presence of a printf format string
 * placeholder. This naive pattern which does not validate the format.
 *
 * @type {RegExp}
 */
const REGEXP_PLACEHOLDER = /%[^%]/g;

module.exports = {
	TRANSLATION_FUNCTIONS,
	REGEXP_PLACEHOLDER,
};
