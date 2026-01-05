/**
 * External dependencies
 */
import type sprintf from '@tannin/sprintf';
import { type TanninDomainMetadata } from 'tannin';

/**
 * Return type for string translation functions.
 *
 * This type should be treated as if it were `string`.
 */
export type TranslatableText< T extends string > = string & {
	/**
	 * DO NOT USE! This property _does not exist_.
	 * @private
	 */
	readonly __translatableText: T;
};

/**
 * Type to extends TanninDomainMetadata to support additional properties.
 */
export type I18nDomainMetadata< TextDomain extends string > =
	TanninDomainMetadata & {
		domain?: TextDomain;
		[ key: string ]: unknown;
	};

/**
 * Locale data is a record of domain names to their metadata or translations.
 */
export type LocaleData< TextDomain extends string = string > = Record<
	string,
	I18nDomainMetadata< TextDomain > | string[]
>;

export type SubscribeCallback = () => void;
export type UnsubscribeCallback = () => void;

/**
 * Retrieve the domain to use when calling domain-specific filters.
 */
export type getFilterDomain = ( domain?: string ) => string;

/**
 * An i18n instance
 */
export interface I18n< TextDomain extends string = string > {
	/**
	 * Returns locale data by domain in a
	 * Jed-formatted JSON object shape.
	 *
	 * @see http://messageformat.github.io/Jed/
	 */
	getLocaleData: ( domain?: TextDomain ) => LocaleData< TextDomain >;

	/**
	 * Merges locale data into the Tannin instance by domain. Note that this
	 * function will overwrite the domain configuration. Accepts data in a
	 * Jed-formatted JSON object shape.
	 *
	 * @see http://messageformat.github.io/Jed/
	 */
	setLocaleData: (
		data?: LocaleData< TextDomain >,
		domain?: TextDomain
	) => void;

	/**
	 * Merges locale data into the Tannin instance by domain. Note that this
	 * function will also merge the domain configuration. Accepts data in a
	 * Jed-formatted JSON object shape.
	 *
	 * @see http://messageformat.github.io/Jed/
	 */
	addLocaleData: (
		data?: LocaleData< TextDomain >,
		domain?: TextDomain
	) => void;

	/**
	 * Resets all current Tannin instance locale data and sets the specified
	 * locale data for the domain. Accepts data in a Jed-formatted JSON object shape.
	 *
	 * @see http://messageformat.github.io/Jed/
	 */
	resetLocaleData: (
		data?: LocaleData< TextDomain >,
		domain?: TextDomain
	) => void;

	/**
	 * Subscribes to changes of locale data
	 */
	subscribe: ( callback: SubscribeCallback ) => UnsubscribeCallback;

	/**
	 * Retrieve the translation of text.
	 *
	 * @see https://developer.wordpress.org/reference/functions/__/
	 */
	__: < Text extends string >(
		text: Text,
		domain?: TextDomain
	) => TranslatableText< Text >;

	/**
	 * Retrieve translated string with gettext context.
	 *
	 * @see https://developer.wordpress.org/reference/functions/_x/
	 */
	_x: < Text extends string >(
		text: Text,
		context: string,
		domain?: TextDomain
	) => TranslatableText< Text >;

	/**
	 * Translates and retrieves the singular or plural form based on the supplied
	 * number.
	 *
	 * @see https://developer.wordpress.org/reference/functions/_n/
	 */
	_n: < Single extends string, Plural extends string >(
		single: Single,
		plural: Plural,
		number: number,
		domain?: TextDomain
	) => TranslatableText< Single | Plural >;

	/**
	 * Translates and retrieves the singular or plural form based on the supplied
	 * number, with gettext context.
	 *
	 * @see https://developer.wordpress.org/reference/functions/_nx/
	 */
	_nx: < Single extends string, Plural extends string >(
		single: Single,
		plural: Plural,
		number: number,
		context: string,
		domain?: TextDomain
	) => TranslatableText< Single | Plural >;

	/**
	 * Check if current locale is RTL.
	 *
	 * **RTL (Right To Left)** is a locale property indicating that text is written from right to left.
	 * For example, the `he` locale (for Hebrew) specifies right-to-left. Arabic (ar) is another common
	 * language written RTL. The opposite of RTL, LTR (Left To Right) is used in other languages,
	 * including English (`en`, `en-US`, `en-GB`, etc.), Spanish (`es`), and French (`fr`).
	 */
	isRTL: () => boolean;

	/**
	 * Check if there is a translation for a given string in singular form.
	 */
	hasTranslation: (
		single: string,
		context?: string,
		domain?: TextDomain
	) => boolean;
}

export type DistributeSprintfArgs< T extends string > = T extends any
	? Parameters< typeof sprintf< T > >[ 1 ]
	: never;
