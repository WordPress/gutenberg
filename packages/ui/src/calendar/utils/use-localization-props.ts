import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { enUS } from 'date-fns/locale';
import type { Modifiers, BaseProps } from '../types';

type IntlLocaleWithWeekInfo = Intl.Locale & {
	getWeekInfo?: () => { firstDay?: number };
	weekInfo?: { firstDay?: number };
};

function isLocaleRTL( locale: Intl.Locale ) {
	const direction = locale.getTextInfo?.().direction;
	if ( direction ) {
		return direction === 'rtl';
	}
	return [
		'ar', // Arabic
		'he', // Hebrew
		'fa', // Persian (Farsi)
		'ur', // Urdu
		'ps', // Pashto
		'syr', // Syriac
		'dv', // Divehi
		'ku', // Kurdish (Sorani)
		'ckb', // Central Kurdish (Sorani)
		'ug', // Uyghur
		'yi', // Yiddish
	].includes( locale.language );
}

function getSupportedLocaleCode( localeCode: string | undefined ) {
	if ( ! localeCode ) {
		return;
	}

	let supportedLocaleCode: string | undefined;
	try {
		supportedLocaleCode = Intl.DateTimeFormat.supportedLocalesOf( [
			localeCode,
		] )[ 0 ];
	} catch {
		// Invalid BCP 47 language tags are expected to use the fallback locale.
	}
	return supportedLocaleCode;
}

function getWeekStartsOn( locale: IntlLocaleWithWeekInfo ) {
	const firstDay = ( locale.getWeekInfo?.() ?? locale.weekInfo )?.firstDay;
	if ( firstDay === undefined || firstDay < 1 || firstDay > 7 ) {
		return;
	}
	return ( firstDay % 7 ) as NonNullable< BaseProps[ 'weekStartsOn' ] >;
}

/**
 * Returns localization props for the calendar components.
 *
 * Notes:
 * - the following props should be intended as defaults, and should
 *   be overridden by consumer props if listed as public props.
 * - It is possible for the translated strings to use a different locale
 *   than the formatted dates and the computed `dir`. This is because the
 *   translation function doesn't expose the locale used for the translated
 *   strings, meaning that dates are formatted using the date locale props.
 *   For a correct localized experience, consumers should make sure that
 *   translation context and date-text locale are consistent.
 * @param props
 * @param props.locale
 * @param props.timeZone
 * @param props.mode
 */
export const useLocalizationProps = ( {
	locale,
	timeZone,
	mode,
}: {
	locale: NonNullable< BaseProps[ 'locale' ] >;
	timeZone: BaseProps[ 'timeZone' ];
	mode: 'single' | 'range';
} ) => {
	return useMemo( () => {
		const isLocaleString = typeof locale === 'string';
		const dateFnsLocale = isLocaleString ? enUS : locale;
		const supportedLocaleCode = getSupportedLocaleCode(
			isLocaleString ? locale : locale.code
		);
		const localeCode = supportedLocaleCode ?? 'en-US';
		const intlLocale = new Intl.Locale(
			localeCode
		) as IntlLocaleWithWeekInfo;
		// Unsupported custom date-fns locales keep their own week-start option.
		const weekStartsOn =
			isLocaleString || supportedLocaleCode !== undefined
				? getWeekStartsOn( intlLocale )
				: undefined;

		// ie. April 2025
		const monthNameFormatter = new Intl.DateTimeFormat( localeCode, {
			calendar: 'gregory',
			year: 'numeric',
			month: 'long',
			timeZone,
		} );
		// ie. M, T, W, T, F, S, S
		const weekdayNarrowFormatter = new Intl.DateTimeFormat( localeCode, {
			calendar: 'gregory',
			weekday: 'narrow',
			timeZone,
		} );
		// ie. Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
		const weekdayLongFormatter = new Intl.DateTimeFormat( localeCode, {
			calendar: 'gregory',
			weekday: 'long',
			timeZone,
		} );
		// ie. Monday, April 29, 2025
		const fullDateFormatter = new Intl.DateTimeFormat( localeCode, {
			calendar: 'gregory',
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			timeZone,
		} );
		const dayNumberFormatter = new Intl.DateTimeFormat( localeCode, {
			calendar: 'gregory',
			day: 'numeric',
			timeZone,
		} );

		// Note: the following props should be intended as defaults, and should
		// be overridden by consumer props if listed as public props.
		return {
			'aria-label':
				mode === 'single'
					? __( 'Date calendar' )
					: __( 'Date range calendar' ),
			labels: {
				/** The label for the navigation toolbar. */
				labelNav: () => __( 'Navigation bar' ),
				/**
				 * The label for the month grid.
				 * @param date
				 */
				labelGrid: monthNameFormatter.format,
				/**
				 * The label for the gridcell, when the calendar is not interactive.
				 * @param date
				 * @param modifiers
				 */
				labelGridcell: (
					date: Date,
					/** The modifiers for the day. */
					modifiers?: Modifiers
				) => {
					const formattedDate = fullDateFormatter.format( date );
					let label = formattedDate;
					if ( modifiers?.today ) {
						label = sprintf(
							// translators: %s is the full date (e.g. "Monday, April 29, 2025")
							__( 'Today, %s' ),
							formattedDate
						);
					}
					return label;
				},
				/** The label for the "next month" button. */
				labelNext: () => __( 'Go to the Next Month' ),
				/** The label for the "previous month" button. */
				labelPrevious: () => __( 'Go to the Previous Month' ),
				/**
				 * The label for the day button.
				 * @param date
				 * @param modifiers
				 */
				labelDayButton: (
					date: Date,
					/** The modifiers for the day. */
					modifiers?: Modifiers
				) => {
					const formattedDate = fullDateFormatter.format( date );
					let label = formattedDate;
					if ( modifiers?.today && modifiers?.selected ) {
						return sprintf(
							// translators: %s is the full date (e.g. "Monday, April 29, 2025")
							__( 'Today, %s, selected' ),
							formattedDate
						);
					}
					if ( modifiers?.today ) {
						label = sprintf(
							// translators: %s is the full date (e.g. "Monday, April 29, 2025")
							__( 'Today, %s' ),
							formattedDate
						);
					}
					if ( modifiers?.selected ) {
						label = sprintf(
							// translators: %s is the full date (e.g. "Monday, April 29, 2025")
							__( '%s, selected' ),
							formattedDate
						);
					}
					return label;
				},
				/**
				 * The label for the weekday.
				 * @param date
				 */
				labelWeekday: weekdayLongFormatter.format,
			},
			locale: dateFnsLocale,
			lang: localeCode,
			dir: isLocaleRTL( intlLocale ) ? 'rtl' : 'ltr',
			...( weekStartsOn === undefined ? {} : { weekStartsOn } ),
			formatters: {
				formatDay: dayNumberFormatter.format,
				formatWeekdayName: weekdayNarrowFormatter.format,
				formatCaption: monthNameFormatter.format,
			},
			timeZone,
		} as const;
	}, [ locale, timeZone, mode ] );
};
