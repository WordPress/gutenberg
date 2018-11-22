/**
 * External dependencies
 */
import Tannin from 'tannin';
import memoize from 'memize';
import sprintfjs from 'sprintf-js';

/**
 * Default locale data to use for Tannin domain when not otherwise provided.
 * Assumes an English plural forms expression.
 *
 * @type {Object}
 */
const DEFAULT_LOCALE_DATA = {
	'': {
		plural_forms: 'plural=(n!=1)',
	},
};

/**
 * Log to console, once per message; or more precisely, per referentially equal
 * argument set. Because Jed throws errors, we log these to the console instead
 * to avoid crashing the application.
 *
 * @param {...*} args Arguments to pass to `console.error`
 */
const logErrorOnce = memoize( console.error ); // eslint-disable-line no-console

/**
 * The underlying instance of Tannin to which exported functions interface.
 *
 * @type {Tannin}
 */
const i18n = new Tannin( {} );

/**
 * Merges locale data into the Tannin instance by domain. Accepts data in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 *
 * @param {?Object} data   Locale data configuration.
 * @param {?string} domain Domain for which configuration applies.
 */
export function setLocaleData( data, domain = 'default' ) {
	i18n.data[ domain ] = {
		...DEFAULT_LOCALE_DATA,
		...i18n.data[ domain ],
		...data,
	};

	// Populate default domain configuration (supported locale date which omits
	// a plural forms expression).
	i18n.data[ domain ][ '' ] = {
		...DEFAULT_LOCALE_DATA[ '' ],
		...i18n.data[ domain ][ '' ],
	};
}

/**
 * Wrapper for Tannin's `dcnpgettext`. Populates default locale data if not
 * otherwise previously assigned.
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
function dcnpgettext( domain = 'default', context, single, plural, number ) {
	if ( ! i18n.data[ domain ] ) {
		setLocaleData( undefined, domain );
	}

	return i18n.dcnpgettext( domain, context, single, plural, number );
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
		return sprintfjs.sprintf( format, ...args );
	} catch ( error ) {
		logErrorOnce( 'sprintf error: \n\n' + error.toString() );

		return format;
	}
}
