/**
 * External dependencies
 */
import Jed from 'jed';

let i18n;

/**
 * Creates a new Jed instance with specified locale data configuration.
 *
 * @see http://messageformat.github.io/Jed/
 *
 * @param {Object} data Locale data configuration.
 */
export function setLocaleData( data ) {
	i18n = new Jed( data );
}

/**
 * Returns the current Jed instance, initializing with a default configuration
 * if not already assigned.
 *
 * @return {Jed} Jed instance.
 */
export function getI18n() {
	if ( ! i18n ) {
		setLocaleData( { '': {} } );
	}

	return i18n;
}

/**
 * Wrapper for Jed's `dcnpgettext`, its most qualified function. Absorbs errors
 * which are thrown as the result of invalid translation.
 *
 * @param {?string} domain  Domain to retrieve the translated text.
 * @param {?string} context Context information for the translators.
 * @param {string}  single  Text to translate if non-plural. Used as fallback
 *                          return value on a caught error.
 * @param {?string} plural  The text to be used if the number is plural.
 * @param {?number} number  The number to compare against to use either the
 *                          singular or plural form.
 *
 * @return {string} The translated string.
 */
export function dcnpgettext( domain, context, single, plural, number ) {
	try {
		return getI18n().dcnpgettext( domain, context, single, plural, number );
	} catch ( error ) {
		// Disable reason: Jed throws errors. To avoid crashing the application
		// we log these to the console instead, and return a default value.

		// eslint-disable-next-line no-console
		console.error( 'Jed localization error: \n\n' + error.toString() );

		return single;
	}
}

/**
 * Retrieve the translation of text.
 *
 * @see https://developer.wordpress.org/reference/functions/__/
 *
 * @param {string}  text   Text to translate.
 * @param {?string} domain Domain to retrieve the translated text.
 *
 * @return {string} Translated text.
 */
export function __( text, domain ) {
	return dcnpgettext( domain, undefined, text );
}

/**
 * Retrieve translated string with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_x/
 *
 * @param {string}  text    Text to translate.
 * @param {string}  context Context information for the translators.
 * @param {?string} domain  Domain to retrieve the translated text.
 *
 * @return {string} Translated context string without pipe.
 */
export function _x( text, context, domain ) {
	return dcnpgettext( domain, context, text );
}

/**
 * Translates and retrieves the singular or plural form based on the supplied
 * number.
 *
 * @see https://developer.wordpress.org/reference/functions/_n/
 *
 * @param {string}  single The text to be used if the number is singular.
 * @param {string}  plural The text to be used if the number is plural.
 * @param {number}  number The number to compare against to use either the
 *                         singular or plural form.
 * @param {?string} domain Domain to retrieve the translated text.
 *
 * @return {string} The translated singular or plural form.
 */
export function _n( single, plural, number, domain ) {
	return dcnpgettext( domain, undefined, single, plural, number );
}

/**
 * Translates and retrieves the singular or plural form based on the supplied
 * number, with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_nx/
 *
 * @param {string}  single  The text to be used if the number is singular.
 * @param {string}  plural  The text to be used if the number is plural.
 * @param {number}  number  The number to compare against to use either the
 *                          singular or plural form.
 * @param {string}  context Context information for the translators.
 * @param {?string} domain  Domain to retrieve the translated text.
 *
 * @return {string} The translated singular or plural form.
 */
export function _nx( single, plural, number, context, domain ) {
	return dcnpgettext( domain, context, single, plural, number );
}

/**
 * Returns a formatted string. If an error occurs in applying the format, the
 * original format string is returned.
 *
 * @param {string}   format  The format of the string to generate.
 * @param {string[]} ...args Arguments to apply to the format.
 *
 * @see http://www.diveintojavascript.com/projects/javascript-sprintf
 *
 * @return {string} The formatted string.
 */
export function sprintf( format, ...args ) {
	try {
		return Jed.sprintf( format, ...args );
	} catch ( error ) {
		// Disable reason: Jed throws errors. To avoid crashing the application
		// we log these to the console instead, and return a default value.

		// eslint-disable-next-line no-console
		console.error( 'Jed sprintf error: \n\n' + error.stack );

		return format;
	}
}
