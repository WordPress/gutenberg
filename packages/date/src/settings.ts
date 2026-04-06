import type { DateSettings } from './types';

// Changes made here will likely need to be synced with Core in the file
// src/wp-includes/script-loader.php in `wp_default_packages_inline_scripts()`.
let settings: DateSettings = {
	l10n: {
		locale: 'en',
		months: [
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		],
		monthsShort: [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		],
		weekdays: [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		],
		weekdaysShort: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
		meridiem: { am: 'am', pm: 'pm', AM: 'AM', PM: 'PM' },
		relative: {
			future: '%s from now',
			past: '%s ago',
			s: 'a few seconds',
			ss: '%d seconds',
			m: 'a minute',
			mm: '%d minutes',
			h: 'an hour',
			hh: '%d hours',
			d: 'a day',
			dd: '%d days',
			M: 'a month',
			MM: '%d months',
			y: 'a year',
			yy: '%d years',
		},
		startOfWeek: 0,
	},
	formats: {
		time: 'g:i a',
		date: 'F j, Y',
		datetime: 'F j, Y g:i a',
		datetimeAbbreviated: 'M j, Y g:i a',
	},
	timezone: { offset: 0, offsetFormatted: '0', string: '', abbr: '' },
};

export function getSettings(): DateSettings {
	return settings;
}

export function setSettings( newSettings: DateSettings ) {
	settings = newSettings;
}
