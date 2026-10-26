import { getLocaleData } from './default-i18n';

const DEFAULT_LOCALE = 'en';

/**
 * Returns the locale of the default text domain, such as `de_DE`. It is the
 * `lang` of the locale data, which translation files include, and which
 * WordPress also sets for the default domain.
 *
 * @return The locale, or the default locale if the locale data has none.
 */
function getLocale(): string {
	const metadata = getLocaleData()?.[ '' ];
	const lang = Array.isArray( metadata ) ? undefined : metadata?.lang;
	return typeof lang === 'string' && lang ? lang : DEFAULT_LOCALE;
}

/**
 * Formats a number for display with the separators and decimal mark of the
 * user's locale, for example `1,234,567.5` in English or `1.234.567,5` in
 * German.
 *
 * The locale is the `lang` of the locale data of the default text domain, as
 * set by `setLocaleData`. Use the function for displayed counts and
 * quantities, and pass the formatted value to `sprintf` with a `%s`
 * placeholder. Keep the numeric value for plural selection with `_n`.
 *
 * @param value   The number to format.
 * @param options Options of `Intl.NumberFormat`, for example
 *                `{ maximumFractionDigits: 2 }`.
 *
 * @return The formatted number.
 */
export function formatNumber(
	value: number,
	options?: Intl.NumberFormatOptions
): string {
	// WordPress locales use underscores (`de_DE`), `Intl` expects hyphens.
	const locale = getLocale().replace( /_/g, '-' );
	try {
		return new Intl.NumberFormat( locale, options ).format( value );
	} catch ( error ) {
		if ( error instanceof RangeError && locale !== DEFAULT_LOCALE ) {
			// The locale is not a valid language tag.
			return new Intl.NumberFormat( DEFAULT_LOCALE, options ).format(
				value
			);
		}
		throw error;
	}
}
