/**
 * External dependencies
 */
import Tannin from 'tannin';

/**
 * @typedef {Record<string,any>} LocaleData
 */

/**
 * Default locale data to use for Tannin domain when not otherwise provided.
 * Assumes an English plural forms expression.
 *
 * @type {LocaleData}
 */
const DEFAULT_LOCALE_DATA = {
	'': {
		/** @param {number} n */
		plural_forms( n ) {
			return n === 1 ? 0 : 1;
		},
	},
};

/**
 * @typedef {(data?: LocaleData, domain?: string) => void} SetLocaleData
 * Merges locale data into the Tannin instance by domain. Accepts data in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */
/**
 * @typedef {(domain?: string) => string} GetFilterDomain
 * Retrieve the domain to use when calling domain-specific filters.
 */
/**
 * @typedef {(text: string, domain?: string) => string} __
 *
 * Retrieve the translation of text.
 *
 * @see https://developer.wordpress.org/reference/functions/__/
 */
/**
 * @typedef {(text: string, context: string, domain?: string) => string} _x
 *
 * Retrieve translated string with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_x/
 */
/**
 * @typedef {(single: string, plural: string, number: number, domain?: string) => string} _n
 *
 * Translates and retrieves the singular or plural form based on the supplied
 * number.
 *
 * @see https://developer.wordpress.org/reference/functions/_n/
 */
/**
 * @typedef {(single: string, plural: string, number: number, context: string, domain?: string) => string} _nx
 *
 * Translates and retrieves the singular or plural form based on the supplied
 * number, with gettext context.
 *
 * @see https://developer.wordpress.org/reference/functions/_nx/
 */
/**
 * @typedef {() => boolean} IsRtl
 *
 * Check if current locale is RTL.
 *
 * **RTL (Right To Left)** is a locale property indicating that text is written from right to left.
 * For example, the `he` locale (for Hebrew) specifies right-to-left. Arabic (ar) is another common
 * language written RTL. The opposite of RTL, LTR (Left To Right) is used in other languages,
 * including English (`en`, `en-US`, `en-GB`, etc.), Spanish (`es`), and French (`fr`).
 */
/**
 * @typedef {{ applyFilters: (hookName:string, ...args: unknown[]) => unknown}} ApplyFiltersInterface
 */

/**
 * An i18n instance
 *
 * @typedef I18n
 * @property {SetLocaleData} setLocaleData Merges locale data into the Tannin instance by domain. Accepts data in a
 *                                         Jed-formatted JSON object shape.
 * @property {__} __                       Retrieve the translation of text.
 * @property {_x} _x                       Retrieve translated string with gettext context.
 * @property {_n} _n                       Translates and retrieves the singular or plural form based on the supplied
 *                                         number.
 * @property {_nx} _nx                     Translates and retrieves the singular or plural form based on the supplied
 *                                         number, with gettext context.
 * @property {IsRtl} isRTL                 Check if current locale is RTL.
 */

/**
 * Create an i18n instance
 *
 * @param {LocaleData} [initialData]    Locale data configuration.
 * @param {string}     [initialDomain]  Domain for which configuration applies.
 * @param {ApplyFiltersInterface} [hooks]     Hooks implementation.
 * @return {I18n}                       I18n instance
 */
export const createI18n = ( initialData, initialDomain, hooks ) => {
	/**
	 * The underlying instance of Tannin to which exported functions interface.
	 *
	 * @type {Tannin}
	 */
	const tannin = new Tannin( {} );

	/** @type {SetLocaleData} */
	const setLocaleData = ( data, domain = 'default' ) => {
		tannin.data[ domain ] = {
			...DEFAULT_LOCALE_DATA,
			...tannin.data[ domain ],
			...data,
		};

		// Populate default domain configuration (supported locale date which omits
		// a plural forms expression).
		tannin.data[ domain ][ '' ] = {
			...DEFAULT_LOCALE_DATA[ '' ],
			...tannin.data[ domain ][ '' ],
		};
	};

	/**
	 * Wrapper for Tannin's `dcnpgettext`. Populates default locale data if not
	 * otherwise previously assigned.
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
	const dcnpgettext = (
		domain = 'default',
		context,
		single,
		plural,
		number
	) => {
		if ( ! tannin.data[ domain ] ) {
			setLocaleData( undefined, domain );
		}

		return tannin.dcnpgettext( domain, context, single, plural, number );
	};

	/** @type {GetFilterDomain} */
	const getFilterDomain = ( domain ) => {
		if ( typeof domain === 'undefined' ) {
			return 'default';
		}
		return domain;
	};

	/** @type {__} */
	const __ = ( text, domain ) => {
		let translation = dcnpgettext( domain, undefined, text );
		/**
		 * Filters text with its translation.
		 *
		 * @param {string} translation Translated text.
		 * @param {string} text        Text to translate.
		 * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
		 */
		if ( typeof hooks === 'undefined' ) {
			return translation;
		}
		translation = /** @type {string} */ (
			/** @type {*} */ hooks.applyFilters(
				'i18n.gettext',
				translation,
				text,
				domain
			)
		);
		return /** @type {string} */ (
			/** @type {*} */ hooks.applyFilters(
				'i18n.gettext_' + getFilterDomain( domain ),
				translation,
				text,
				domain
			)
		);
	};

	/** @type {_x} */
	const _x = ( text, context, domain ) => {
		let translation = dcnpgettext( domain, context, text );
		/**
		 * Filters text with its translation based on context information.
		 *
		 * @param {string} translation Translated text.
		 * @param {string} text        Text to translate.
		 * @param {string} context     Context information for the translators.
		 * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
		 */
		if ( typeof hooks === 'undefined' ) {
			return translation;
		}
		translation = /** @type {string} */ (
			/** @type {*} */ hooks.applyFilters(
				'i18n.gettext_with_context',
				translation,
				text,
				context,
				domain
			)
		);
		return /** @type {string} */ (
			/** @type {*} */ hooks.applyFilters(
				'i18n.gettext_with_context_' + getFilterDomain( domain ),
				translation,
				text,
				context,
				domain
			)
		);
	};

	/** @type {_n} */
	const _n = ( single, plural, number, domain ) => {
		let translation = dcnpgettext(
			domain,
			undefined,
			single,
			plural,
			number
		);
		if ( typeof hooks === 'undefined' ) {
			return translation;
		}
		/**
		 * Filters the singular or plural form of a string.
		 *
		 * @param {string} translation Translated text.
		 * @param {string} single      The text to be used if the number is singular.
		 * @param {string} plural      The text to be used if the number is plural.
		 * @param {string} number      The number to compare against to use either the singular or plural form.
		 * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
		 */
		translation = /** @type {string} */ (
			/** @type {*} */ hooks.applyFilters(
				'i18n.ngettext',
				translation,
				single,
				plural,
				number,
				domain
			)
		);
		return /** @type {string} */ (
			/** @type {*} */ hooks.applyFilters(
				'i18n.ngettext_' + getFilterDomain( domain ),
				translation,
				single,
				plural,
				number,
				domain
			)
		);
	};

	/** @type {_nx} */
	const _nx = ( single, plural, number, context, domain ) => {
		let translation = dcnpgettext(
			domain,
			context,
			single,
			plural,
			number
		);
		if ( typeof hooks === 'undefined' ) {
			return translation;
		}
		/**
		 * Filters the singular or plural form of a string with gettext context.
		 *
		 * @param {string} translation Translated text.
		 * @param {string} single      The text to be used if the number is singular.
		 * @param {string} plural      The text to be used if the number is plural.
		 * @param {string} number      The number to compare against to use either the singular or plural form.
		 * @param {string} context     Context information for the translators.
		 * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
		 */
		translation = /** @type {string} */ (
			/** @type {*} */ hooks.applyFilters(
				'i18n.ngettext_with_context',
				translation,
				single,
				plural,
				number,
				context,
				domain
			)
		);

		return /** @type {string} */ (
			/** @type {*} */ hooks.applyFilters(
				'i18n.ngettext_with_context_' + getFilterDomain( domain ),
				translation,
				single,
				plural,
				number,
				context,
				domain
			)
		);
	};

	/** @type {IsRtl} */
	const isRTL = () => {
		return 'rtl' === _x( 'ltr', 'text direction' );
	};

	if ( initialData ) {
		setLocaleData( initialData, initialDomain );
	}

	return {
		setLocaleData,
		__,
		_x,
		_n,
		_nx,
		isRTL,
	};
};
