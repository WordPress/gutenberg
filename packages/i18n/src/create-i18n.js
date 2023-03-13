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

/*
 * Regular expression that matches i18n hooks like `i18n.gettext`, `i18n.ngettext`,
 * `i18n.gettext_domain` or `i18n.ngettext_with_context` or `i18n.has_translation`.
 */
const I18N_HOOK_REGEXP = /^i18n\.(n?gettext|has_translation)(_|$)/;

/**
 * @typedef {(domain?: string) => LocaleData} GetLocaleData
 *
 * Returns locale data by domain in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */
/**
 * @typedef {(data?: LocaleData, domain?: string) => void} SetLocaleData
 *
 * Merges locale data into the Tannin instance by domain. Note that this
 * function will overwrite the domain configuration. Accepts data in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */
/**
 * @typedef {(data?: LocaleData, domain?: string) => void} AddLocaleData
 *
 * Merges locale data into the Tannin instance by domain. Note that this
 * function will also merge the domain configuration. Accepts data in a
 * Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */
/**
 * @typedef {(data?: LocaleData, domain?: string) => void} ResetLocaleData
 *
 * Resets all current Tannin instance locale data and sets the specified
 * locale data for the domain. Accepts data in a Jed-formatted JSON object shape.
 *
 * @see http://messageformat.github.io/Jed/
 */
/** @typedef {() => void} SubscribeCallback */
/** @typedef {() => void} UnsubscribeCallback */
/**
 * @typedef {(callback: SubscribeCallback) => UnsubscribeCallback} Subscribe
 *
 * Subscribes to changes of locale data
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
 * @typedef {(single: string, context?: string, domain?: string) => boolean} HasTranslation
 *
 * Check if there is a translation for a given string in singular form.
 */
/** @typedef {import('@wordpress/hooks').Hooks} Hooks */

/**
 * An i18n instance
 *
 * @typedef I18n
 * @property {GetLocaleData}   getLocaleData   Returns locale data by domain in a Jed-formatted JSON object shape.
 * @property {SetLocaleData}   setLocaleData   Merges locale data into the Tannin instance by domain. Note that this
 *                                             function will overwrite the domain configuration. Accepts data in a
 *                                             Jed-formatted JSON object shape.
 * @property {AddLocaleData}   addLocaleData   Merges locale data into the Tannin instance by domain. Note that this
 *                                             function will also merge the domain configuration. Accepts data in a
 *                                             Jed-formatted JSON object shape.
 * @property {ResetLocaleData} resetLocaleData Resets all current Tannin instance locale data and sets the specified
 *                                             locale data for the domain. Accepts data in a Jed-formatted JSON object shape.
 * @property {Subscribe}       subscribe       Subscribes to changes of Tannin locale data.
 * @property {__}              __              Retrieve the translation of text.
 * @property {_x}              _x              Retrieve translated string with gettext context.
 * @property {_n}              _n              Translates and retrieves the singular or plural form based on the supplied
 *                                             number.
 * @property {_nx}             _nx             Translates and retrieves the singular or plural form based on the supplied
 *                                             number, with gettext context.
 * @property {IsRtl}           isRTL           Check if current locale is RTL.
 * @property {HasTranslation}  hasTranslation  Check if there is a translation for a given string.
 */

/**
 * Create an i18n instance
 *
 * @param {LocaleData} [initialData]   Locale data configuration.
 * @param {string}     [initialDomain] Domain for which configuration applies.
 * @param {Hooks}      [hooks]         Hooks implementation.
 *
 * @return {I18n} I18n instance.
 */
export const createI18n = ( initialData, initialDomain, hooks ) => {
	/**
	 * The underlying instance of Tannin to which exported functions interface.
	 *
	 * @type {Tannin}
	 */
	const tannin = new Tannin( {} );

	const listeners = new Set();

	const notifyListeners = () => {
		listeners.forEach( ( listener ) => listener() );
	};

	/**
	 * Subscribe to changes of locale data.
	 *
	 * @param {SubscribeCallback} callback Subscription callback.
	 * @return {UnsubscribeCallback} Unsubscribe callback.
	 */
	const subscribe = ( callback ) => {
		listeners.add( callback );
		return () => listeners.delete( callback );
	};

	/** @type {GetLocaleData} */
	const getLocaleData = ( domain = 'default' ) => tannin.data[ domain ];

	/**
	 * @param {LocaleData} [data]
	 * @param {string}     [domain]
	 */
	const doSetLocaleData = ( data, domain = 'default' ) => {
		tannin.data[ domain ] = {
			...tannin.data[ domain ],
			...data,
		};

		// Populate default domain configuration (supported locale date which omits
		// a plural forms expression).
		tannin.data[ domain ][ '' ] = {
			...DEFAULT_LOCALE_DATA[ '' ],
			...tannin.data[ domain ]?.[ '' ],
		};

		// Clean up cached plural forms functions cache as it might be updated.
		delete tannin.pluralForms[ domain ];
	};

	/** @type {SetLocaleData} */
	const setLocaleData = ( data, domain ) => {
		doSetLocaleData( data, domain );
		notifyListeners();
	};

	/** @type {AddLocaleData} */
	const addLocaleData = ( data, domain = 'default' ) => {
		tannin.data[ domain ] = {
			...tannin.data[ domain ],
			...data,
			// Populate default domain configuration (supported locale date which omits
			// a plural forms expression).
			'': {
				...DEFAULT_LOCALE_DATA[ '' ],
				...tannin.data[ domain ]?.[ '' ],
				...data?.[ '' ],
			},
		};

		// Clean up cached plural forms functions cache as it might be updated.
		delete tannin.pluralForms[ domain ];

		notifyListeners();
	};

	/** @type {ResetLocaleData} */
	const resetLocaleData = ( data, domain ) => {
		// Reset all current Tannin locale data.
		tannin.data = {};

		// Reset cached plural forms functions cache.
		tannin.pluralForms = {};

		setLocaleData( data, domain );
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
			// Use `doSetLocaleData` to set silently, without notifying listeners.
			doSetLocaleData( undefined, domain );
		}

		return tannin.dcnpgettext( domain, context, single, plural, number );
	};

	/** @type {GetFilterDomain} */
	const getFilterDomain = ( domain = 'default' ) => domain;

	/** @type {__} */
	const __ = ( text, domain ) => {
		let translation = dcnpgettext( domain, undefined, text );
		if ( ! hooks ) {
			return translation;
		}

		/**
		 * Filters text with its translation.
		 *
		 * @param {string} translation Translated text.
		 * @param {string} text        Text to translate.
		 * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
		 */
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
		if ( ! hooks ) {
			return translation;
		}

		/**
		 * Filters text with its translation based on context information.
		 *
		 * @param {string} translation Translated text.
		 * @param {string} text        Text to translate.
		 * @param {string} context     Context information for the translators.
		 * @param {string} domain      Text domain. Unique identifier for retrieving translated strings.
		 */
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
		if ( ! hooks ) {
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
		if ( ! hooks ) {
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

	/** @type {HasTranslation} */
	const hasTranslation = ( single, context, domain ) => {
		const key = context ? context + '\u0004' + single : single;
		let result = !! tannin.data?.[ domain ?? 'default' ]?.[ key ];
		if ( hooks ) {
			/**
			 * Filters the presence of a translation in the locale data.
			 *
			 * @param {boolean} hasTranslation Whether the translation is present or not..
			 * @param {string}  single         The singular form of the translated text (used as key in locale data)
			 * @param {string}  context        Context information for the translators.
			 * @param {string}  domain         Text domain. Unique identifier for retrieving translated strings.
			 */
			result = /** @type { boolean } */ (
				/** @type {*} */ hooks.applyFilters(
					'i18n.has_translation',
					result,
					single,
					context,
					domain
				)
			);

			result = /** @type { boolean } */ (
				/** @type {*} */ hooks.applyFilters(
					'i18n.has_translation_' + getFilterDomain( domain ),
					result,
					single,
					context,
					domain
				)
			);
		}
		return result;
	};

	if ( initialData ) {
		setLocaleData( initialData, initialDomain );
	}

	if ( hooks ) {
		/**
		 * @param {string} hookName
		 */
		const onHookAddedOrRemoved = ( hookName ) => {
			if ( I18N_HOOK_REGEXP.test( hookName ) ) {
				notifyListeners();
			}
		};

		hooks.addAction( 'hookAdded', 'core/i18n', onHookAddedOrRemoved );
		hooks.addAction( 'hookRemoved', 'core/i18n', onHookAddedOrRemoved );
	}

	return {
		getLocaleData,
		setLocaleData,
		addLocaleData,
		resetLocaleData,
		subscribe,
		__,
		_x,
		_n,
		_nx,
		isRTL,
		hasTranslation,
	};
};
