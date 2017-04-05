/**
 * External dependencies
 */
import Jed from 'jed';

let i18n;

/**
 * Creates a new Jed instance with specified locale data configuration.
 *
 * @param {Object} data Locale data configuration
 */
export function setLocaleData( data ) {
	i18n = new Jed( data );
}

/**
 * Returns the current Jed instance, initializing with a default configuration
 * if not already assigned.
 *
 * @return {Jed} Jed instance
 */
export function getI18n() {
	if ( ! i18n ) {
		setLocaleData( { '': {} } );
	}

	return i18n;
}

/**
 * Retrieve the translation of text.
 *
 * @param  {string} text Text to translate
 * @return {string}      Translated text
 */
export function __( text ) {
	return getI18n().gettext( text );
}

/**
 * Retrieve translated string with gettext context.
 *
 * @param  {string} text    Text to translate
 * @param  {string} context Context information for the translators
 * @return {string}         Translated context string without pipe
 */
export function _x( text, context ) {
	return getI18n().pgettext( context, text );
}

/**
 * Translates and retrieves the singular or plural form based on the supplied
 * number.
 *
 * @param  {string} single The text to be used if the number is singular
 * @param  {string} plural The text to be used if the number is plural
 * @param  {Number} number The number to compare against to use either the
 *                         singular or plural form
 * @return {string}        The translated singular or plural form
 */
export function _n( single, plural, number ) {
	return getI18n().ngettext( single, plural, number );
}

/**
 * Translates and retrieves the singular or plural form based on the supplied
 * number, with gettext context.
 *
 * @param  {string} single  The text to be used if the number is singular
 * @param  {string} plural  The text to be used if the number is plural
 * @param  {Number} number  The number to compare against to use either the
 *                          singular or plural form
 * @param  {string} context Context information for the translators
 * @return {string}         The translated singular or plural form
 */
export function _nx( single, plural, number, context ) {
	return getI18n().npgettext( context, single, plural, number );
}

/**
 * Returns a formatted string.
 *
 * @see http://www.diveintojavascript.com/projects/javascript-sprintf
 *
 * @type {string}
 */
export const sprintf = Jed.sprintf;
