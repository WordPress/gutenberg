/**
 * External dependencies
 */
import type { TanninLocaleDomain } from 'tannin';
import Tannin from 'tannin';
/**
 * Internal dependencies
 */
import type {
	getFilterDomain,
	I18n,
	LocaleData,
	SubscribeCallback,
	TranslatableText,
	UnsubscribeCallback,
} from './types';
/**
 * WordPress dependencies
 */
import type { Hooks } from '@wordpress/hooks';
/**
 * Default locale data to use for Tannin domain when not otherwise provided.
 * Assumes an English plural forms expression.
 */
const DEFAULT_LOCALE_DATA: LocaleData = {
	'': {
		plural_forms( n: number ) {
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
 * Create an i18n instance
 *
 * @param [initialData]   Locale data configuration.
 * @param [initialDomain] Domain for which configuration applies.
 * @param [hooks]         Hooks implementation.
 *
 * @return I18n instance.
 */
export const createI18n = < TextDomain extends string >(
	initialData?: LocaleData< TextDomain >,
	initialDomain?: TextDomain,
	hooks?: Hooks
): I18n< TextDomain > => {
	/**
	 * The underlying instance of Tannin to which exported functions interface.
	 */
	const tannin = new Tannin( {} );

	const listeners = new Set< () => void >();

	const notifyListeners = () => {
		listeners.forEach( ( listener ) => listener() );
	};

	/**
	 * Subscribe to changes of locale data.
	 *
	 * @param callback Subscription callback.
	 * @return Unsubscribe callback.
	 */
	const subscribe = ( callback: SubscribeCallback ): UnsubscribeCallback => {
		listeners.add( callback );
		return () => listeners.delete( callback );
	};

	const getLocaleData: I18n< TextDomain >[ 'getLocaleData' ] = (
		domain = 'default' as TextDomain
	) => tannin.data[ domain ] as LocaleData< TextDomain >;

	/**
	 * @param [data]
	 * @param [domain]
	 */
	const doSetLocaleData = (
		data?: LocaleData,
		domain: TextDomain = 'default' as TextDomain
	) => {
		tannin.data[ domain ] = {
			...tannin.data[ domain ],
			...data,
		} as TanninLocaleDomain;

		// Populate default domain configuration (supported locale date which omits
		// a plural forms expression).
		tannin.data[ domain ][ '' ] = {
			...DEFAULT_LOCALE_DATA[ '' ],
			...tannin.data[ domain ]?.[ '' ],
		};

		// Clean up cached plural forms functions cache as it might be updated.
		delete tannin.pluralForms[ domain ];
	};

	const setLocaleData: I18n< TextDomain >[ 'setLocaleData' ] = (
		data,
		domain
	) => {
		doSetLocaleData( data, domain );
		notifyListeners();
	};

	const addLocaleData: I18n< TextDomain >[ 'addLocaleData' ] = (
		data,
		domain = 'default' as TextDomain
	) => {
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
		} as TanninLocaleDomain;

		// Clean up cached plural forms functions cache as it might be updated.
		delete tannin.pluralForms[ domain ];

		notifyListeners();
	};

	const resetLocaleData: I18n< TextDomain >[ 'resetLocaleData' ] = (
		data,
		domain
	) => {
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
	 * @param domain   Domain to retrieve the translated text.
	 * @param context  Context information for the translators.
	 * @param single   Text to translate if non-plural. Used as
	 *                 fallback return value on a caught error.
	 * @param [plural] The text to be used if the number is
	 *                 plural.
	 * @param [number] The number to compare against to use
	 *                 either the singular or plural form.
	 *
	 * @return The translated string.
	 */
	const dcnpgettext = (
		domain = 'default' as TextDomain,
		context: string | void,
		single: string,
		plural?: string,
		number?: number
	): string => {
		if ( ! tannin.data[ domain ] ) {
			// Use `doSetLocaleData` to set silently, without notifying listeners.
			doSetLocaleData( undefined, domain );
		}

		return tannin.dcnpgettext( domain, context, single, plural, number );
	};

	const getFilterDomain: getFilterDomain = ( domain ) => domain || 'default';

	const __: I18n< TextDomain >[ '__' ] = ( text, domain ) => {
		let translation = dcnpgettext( domain, undefined, text );
		if ( ! hooks ) {
			return translation as TranslatableText< typeof text >;
		}

		/**
		 * Filters text with its translation.
		 *
		 * @param translation Translated text.
		 * @param text        Text to translate.
		 * @param domain      Text domain. Unique identifier for retrieving translated strings.
		 */
		translation = hooks.applyFilters(
			'i18n.gettext',
			translation,
			text,
			domain
		) as TranslatableText< typeof text >;

		return hooks.applyFilters(
			'i18n.gettext_' + getFilterDomain( domain ),
			translation,
			text,
			domain
		) as TranslatableText< typeof text >;
	};

	const _x: I18n< TextDomain >[ '_x' ] = ( text, context, domain ) => {
		let translation = dcnpgettext( domain, context, text );
		if ( ! hooks ) {
			return translation as TranslatableText< typeof text >;
		}

		/**
		 * Filters text with its translation based on context information.
		 *
		 * @param translation Translated text.
		 * @param text        Text to translate.
		 * @param context     Context information for the translators.
		 * @param domain      Text domain. Unique identifier for retrieving translated strings.
		 */
		translation = hooks.applyFilters(
			'i18n.gettext_with_context',
			translation,
			text,
			context,
			domain
		) as TranslatableText< typeof text >;

		return hooks.applyFilters(
			'i18n.gettext_with_context_' + getFilterDomain( domain ),
			translation,
			text,
			context,
			domain
		) as TranslatableText< typeof text >;
	};

	const _n: I18n< TextDomain >[ '_n' ] = (
		single,
		plural,
		number,
		domain
	) => {
		let translation = dcnpgettext(
			domain,
			undefined,
			single,
			plural,
			number
		);
		if ( ! hooks ) {
			return translation as TranslatableText<
				typeof single | typeof plural
			>;
		}

		/**
		 * Filters the singular or plural form of a string.
		 *
		 * @param translation Translated text.
		 * @param single      The text to be used if the number is singular.
		 * @param plural      The text to be used if the number is plural.
		 * @param number      The number to compare against to use either the singular or plural form.
		 * @param domain      Text domain. Unique identifier for retrieving translated strings.
		 */
		translation = hooks.applyFilters(
			'i18n.ngettext',
			translation,
			single,
			plural,
			number,
			domain
		) as TranslatableText< typeof single | typeof plural >;

		return hooks.applyFilters(
			'i18n.ngettext_' + getFilterDomain( domain ),
			translation,
			single,
			plural,
			number,
			domain
		) as TranslatableText< typeof single | typeof plural >;
	};

	const _nx: I18n< TextDomain >[ '_nx' ] = (
		single,
		plural,
		number,
		context,
		domain
	) => {
		let translation = dcnpgettext(
			domain,
			context,
			single,
			plural,
			number
		);
		if ( ! hooks ) {
			return translation as TranslatableText<
				typeof single | typeof plural
			>;
		}

		/**
		 * Filters the singular or plural form of a string with gettext context.
		 *
		 * @param translation Translated text.
		 * @param single      The text to be used if the number is singular.
		 * @param plural      The text to be used if the number is plural.
		 * @param number      The number to compare against to use either the singular or plural form.
		 * @param context     Context information for the translators.
		 * @param domain      Text domain. Unique identifier for retrieving translated strings.
		 */
		translation = hooks.applyFilters(
			'i18n.ngettext_with_context',
			translation,
			single,
			plural,
			number,
			context,
			domain
		) as TranslatableText< typeof single | typeof plural >;

		return hooks.applyFilters(
			'i18n.ngettext_with_context_' + getFilterDomain( domain ),
			translation,
			single,
			plural,
			number,
			context,
			domain
		) as TranslatableText< typeof single | typeof plural >;
	};

	const isRTL: I18n< TextDomain >[ 'isRTL' ] = () => {
		return 'rtl' === _x( 'ltr', 'text direction' );
	};

	const hasTranslation: I18n< TextDomain >[ 'hasTranslation' ] = (
		single,
		context,
		domain
	) => {
		const key = context ? context + '\u0004' + single : single;
		let result = !! tannin.data?.[ domain ?? 'default' ]?.[ key ];
		if ( hooks ) {
			/**
			 * Filters the presence of a translation in the locale data.
			 *
			 * @param hasTranslation Whether the translation is present or not..
			 * @param single         The singular form of the translated text (used as key in locale data)
			 * @param context        Context information for the translators.
			 * @param domain         Text domain. Unique identifier for retrieving translated strings.
			 */
			result = hooks.applyFilters(
				'i18n.has_translation',
				result,
				single,
				context,
				domain
			) as boolean;

			result = hooks.applyFilters(
				'i18n.has_translation_' + getFilterDomain( domain ),
				result,
				single,
				context,
				domain
			) as boolean;
		}
		return result;
	};

	if ( initialData ) {
		setLocaleData( initialData, initialDomain );
	}

	if ( hooks ) {
		/**
		 * @param hookName
		 */
		const onHookAddedOrRemoved = ( hookName: string ) => {
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
