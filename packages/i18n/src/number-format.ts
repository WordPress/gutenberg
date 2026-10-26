/**
 * Settings used to format numbers.
 */
export interface NumberFormatSettings {
	/**
	 * Locale of the user, such as `en`, `de_DE`, or `de-DE`. Underscores are
	 * converted to hyphens when formatting, so both WordPress locales and BCP
	 * 47 language tags are accepted.
	 */
	locale: string;
}

const DEFAULT_LOCALE = 'en';

let settings: NumberFormatSettings = { locale: DEFAULT_LOCALE };

/**
 * Sets the settings used to format numbers. In WordPress, this is called from
 * an inline script with the locale of the current user.
 *
 * @param newSettings Number format settings.
 */
export function setSettings( newSettings: NumberFormatSettings ) {
	settings = { ...newSettings };
}

/**
 * Returns the settings used to format numbers.
 *
 * @return Number format settings.
 */
export function getSettings(): NumberFormatSettings {
	return settings;
}

/**
 * Formats a number for display with the separators and decimal mark of the
 * user's locale, for example `1,234,567.5` in English or `1.234.567,5` in
 * German.
 *
 * Use it for displayed counts and quantities, and pass the formatted value to
 * `sprintf` with a `%s` placeholder. Keep the numeric value for plural
 * selection with `_n`.
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
	const locale = settings.locale.replace( /_/g, '-' );
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
