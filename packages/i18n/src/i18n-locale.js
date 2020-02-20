/**
 * External dependencies
 */
import Tannin from 'tannin';

/**
 * @typedef {{[key: string]: any}} LocaleData
 */

const DEFAULT_TEXT_DOMAIN = 'default';

/**
 * Default locale data to use for Tannin domain when not otherwise provided.
 * Assumes an English plural forms expression.
 *
 * @type {LocaleData}
 */
const DEFAULT_LOCALE_DATA = {
	'': {
		plural_forms: ( n ) => ( n === 1 ? 0 : 1 ),
	},
};

export default class I18nLocale {
	/**
	 * @param {LocaleData} [data]   Locale data configuration.
	 * @param {string}     [domain] Domain for which configuration applies.
	 */
	constructor( data, domain ) {
		/**
		 * The underlying instance of Tannin to which exported functions interface.
		 *
		 * @private
		 *
		 * @type {Tannin}
		 */
		this._tannin = new Tannin( {} );
		this.setLocaleData( data, domain );
	}

	/**
	 * Merges locale data into the Tannin instance by domain. Accepts data in a
	 * Jed-formatted JSON object shape.
	 *
	 * @see http://messageformat.github.io/Jed/
	 *
	 * @param {LocaleData} [data]   Locale data configuration.
	 * @param {string}     [domain] Domain for which configuration applies.
	 */
	setLocaleData( data, domain = DEFAULT_TEXT_DOMAIN ) {
		this._tannin.data[ domain ] = {
			...DEFAULT_LOCALE_DATA,
			...this._tannin.data[ domain ],
			...data,
		};

		// Populate default domain configuration (supported locale date which omits
		// a plural forms expression).
		this._tannin.data[ domain ][ '' ] = {
			...DEFAULT_LOCALE_DATA[ '' ],
			...this._tannin.data[ domain ][ '' ],
		};
	}

	/**
	 * Wrapper for Tannin's `dcnpgettext`. Populates default locale data if not
	 * otherwise previously assigned.
	 *
	 * @private
	 *
	 * @param {string|undefined} domain   Domain to retrieve the translated text.
	 * @param {string|undefined} context  Context information for the translators.
	 * @param {string}           single   Text to translate if non-plural. Used as
	 *                                    fallback return value on a caught error.
	 * @param {string}           [plural] The text to be used if the number is
	 *                                    plural.
	 * @param {number}           [number] The number to compare against to use
	 *                                    either the singular or plural form.
	 *
	 * @return {string} The translated string.
	 */
	_dcnpgettext(
		domain = DEFAULT_TEXT_DOMAIN,
		context,
		single,
		plural,
		number
	) {
		if ( ! this._tannin.data[ domain ] ) {
			this.setLocaleData( undefined, domain );
		}

		return this._tannin.dcnpgettext(
			domain,
			context,
			single,
			plural,
			number
		);
	}

	/**
	 * Retrieve the translation of text.
	 *
	 * @see https://developer.wordpress.org/reference/functions/__/
	 *
	 * @param {string} text     Text to translate.
	 * @param {string} [domain] Domain to retrieve the translated text.
	 *
	 * @return {string} Translated text.
	 */
	__( text, domain ) {
		return this._dcnpgettext( domain, undefined, text );
	}

	/**
	 * Retrieve translated string with gettext context.
	 *
	 * @see https://developer.wordpress.org/reference/functions/_x/
	 *
	 * @param {string} text     Text to translate.
	 * @param {string} context  Context information for the translators.
	 * @param {string} [domain] Domain to retrieve the translated text.
	 *
	 * @return {string} Translated context string without pipe.
	 */
	_x( text, context, domain ) {
		return this._dcnpgettext( domain, context, text );
	}

	/**
	 * Translates and retrieves the singular or plural form based on the supplied
	 * number.
	 *
	 * @see https://developer.wordpress.org/reference/functions/_n/
	 *
	 * @param {string} single   The text to be used if the number is singular.
	 * @param {string} plural   The text to be used if the number is plural.
	 * @param {number} number   The number to compare against to use either the
	 *                          singular or plural form.
	 * @param {string} [domain] Domain to retrieve the translated text.
	 *
	 * @return {string} The translated singular or plural form.
	 */
	_n( single, plural, number, domain ) {
		return this._dcnpgettext( domain, undefined, single, plural, number );
	}

	/**
	 * Translates and retrieves the singular or plural form based on the supplied
	 * number, with gettext context.
	 *
	 * @see https://developer.wordpress.org/reference/functions/_nx/
	 *
	 * @param {string} single   The text to be used if the number is singular.
	 * @param {string} plural   The text to be used if the number is plural.
	 * @param {number} number   The number to compare against to use either the
	 *                          singular or plural form.
	 * @param {string} context  Context information for the translators.
	 * @param {string} [domain] Domain to retrieve the translated text.
	 *
	 * @return {string} The translated singular or plural form.
	 */
	_nx( single, plural, number, context, domain ) {
		return this._dcnpgettext( domain, context, single, plural, number );
	}
}
