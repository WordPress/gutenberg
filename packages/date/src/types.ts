/**
 * External dependencies
 */
import type { LocaleSpecification as MomentLocaleSpecification } from 'moment';

export type MeridiemConfig = {
	/**
	 * Lowercase AM.
	 */
	am: string;

	/**
	 * Uppercase AM.
	 */
	AM: string;

	/**
	 * Lowercase PM.
	 */
	pm: string;

	/**
	 * Uppercase PM.
	 */
	PM: string;
};

export type FormatsConfig = {
	/**
	 * Time format.
	 */
	time: string;

	/**
	 * Date format.
	 */
	date: string;

	/**
	 * Datetime format.
	 */
	datetime: string;

	/**
	 * Abbreviated datetime format.
	 */
	datetimeAbbreviated: string;
};

export type TimezoneConfig = {
	/**
	 * Offset setting.
	 */
	offset: number;

	/**
	 * Offset setting with decimals formatted to minutes.
	 */
	offsetFormatted: string;

	/**
	 * The timezone as a string (e.g., `'America/Los_Angeles'`).
	 */
	string: string;

	/**
	 * Abbreviation for the timezone.
	 */
	abbr: string;
};

export type L10nSettings = {
	/**
	 * Moment locale.
	 */
	locale: string;

	/**
	 * Locale months.
	 *
	 * @example
	 * ['January', 'February', ... ]
	 */
	months: MomentLocaleSpecification[ 'months' ];

	/**
	 * Locale months short.
	 *
	 * @example
	 * ['Jan', 'Feb', ... ]
	 */
	monthsShort: MomentLocaleSpecification[ 'monthsShort' ];

	/**
	 * Locale weekdays.
	 *
	 * @example
	 * ['Sunday', 'Monday', ... ]
	 */
	weekdays: MomentLocaleSpecification[ 'weekdays' ];

	/**
	 * Locale weekdays short.
	 */
	weekdaysShort: MomentLocaleSpecification[ 'weekdaysShort' ];

	/**
	 * Meridiem config.
	 */
	meridiem: MeridiemConfig;

	/**
	 * Relative time config.
	 */
	relative: MomentLocaleSpecification[ 'relativeTime' ];

	/**
	 * Day that the week starts on.
	 */
	startOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

export type DateSettings = {
	/**
	 * Localization settings.
	 */
	l10n: L10nSettings;

	/**
	 * Date/time formats config.
	 */
	formats: FormatsConfig;

	/**
	 * Timezone settings.
	 */
	timezone: TimezoneConfig;
};
