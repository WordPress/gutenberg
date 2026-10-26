import { getSettings } from '@wordpress/date';

/**
 * Formats a number for display using the user's locale.
 *
 * @param value The number to format.
 * @return The formatted number, with locale-specific separators.
 */
export default function formatNumber( value: number ): string {
	// Keep the language and the region: `Intl` knows nothing about a qualifier
	// such as `de_DE_formal` or `pt_PT_ao90`.
	const [ language, region ] = getSettings().l10n.locale.split( '_' );
	const locale = region ? `${ language }-${ region }` : language;
	return new Intl.NumberFormat( locale ).format( value );
}
