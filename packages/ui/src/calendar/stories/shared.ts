import {
	enUS,
	fr,
	es,
	de,
	it,
	he,
	ru,
	ja,
	ptBR,
	nl,
	ko,
	tr,
	id,
	zhCN,
	zhTW,
	ar,
	sv,
} from 'date-fns/locale';

// Storybook date controls pass a number, but DayPicker expects a Date.
// for props such as `endMonth`.
export function toDate( value: Date | number | undefined ): Date | undefined {
	return value === undefined ? undefined : new Date( value );
}

/**
 * The `argTypes` shared by `Calendar` and `RangeCalendar` — the entire
 * `BaseProps` surface is common to both.
 */
export const SHARED_ARG_TYPES = {
	locale: {
		options: [
			'English (US)',
			'French',
			'Spanish',
			'German',
			'Italian',
			'Hebrew',
			'Russian',
			'Japanese',
			'Portuguese (Brazil)',
			'Dutch',
			'Korean',
			'Turkish',
			'Indonesian',
			'Chinese (Simplified)',
			'Chinese (Traditional)',
			'Arabic',
			'Swedish',
		],
		mapping: {
			'English (US)': enUS,
			French: fr,
			Spanish: es,
			German: de,
			Italian: it,
			Hebrew: he,
			Russian: ru,
			Japanese: ja,
			'Portuguese (Brazil)': ptBR,
			Dutch: nl,
			Korean: ko,
			Turkish: tr,
			Indonesian: id,
			'Chinese (Simplified)': zhCN,
			'Chinese (Traditional)': zhTW,
			Arabic: ar,
			Swedish: sv,
		},
		control: 'select',
	},
	timeZone: {
		options: [
			'Pacific/Honolulu',
			'America/New_York',
			'Europe/London',
			'Asia/Tokyo',
			'Pacific/Auckland',
		],
		control: 'select',
	},
	labels: {
		control: false,
	},
	value: { control: 'date' },
	defaultValue: { control: 'date' },
	onValueChange: {
		control: false,
	},
	defaultMonth: { control: 'date' },
	month: { control: 'date' },
	onMonthChange: {
		control: false,
	},
	endMonth: { control: 'date' },
	startMonth: { control: 'date' },
	render: { control: false },
} as const;

/**
 * A representative mix of every `Matcher` shape supported by the `disabled`
 * prop.
 */
export const DISABLED_DATES_SAMPLE = [
	// Disable tomorrow (single date)
	new Date( new Date().setDate( new Date().getDate() + 1 ) ),
	// Disable all dates after Feb 1st of next year
	{ after: new Date( new Date().getFullYear() + 1, 1, 1 ) },
	// Disable all dates before Dec 1st of last year
	{ before: new Date( new Date().getFullYear() - 1, 11, 1 ) },
	// Disable all dates between 12th and 14th of August of this year
	{
		after: new Date( new Date().getFullYear(), 7, 11 ),
		before: new Date( new Date().getFullYear(), 7, 15 ),
	},
	// Disable all dates between 21st and 26th of October of this year
	{
		from: new Date( new Date().getFullYear(), 9, 21 ),
		to: new Date( new Date().getFullYear(), 9, 26 ),
	},
	// Disable all Wednesdays
	{ dayOfWeek: 3 },
	// Disable all prime day numbers
	function isPrimeDate( date: Date ) {
		return [ 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31 ].includes(
			date.getDate()
		);
	},
];

const nextMonth = new Date().getMonth() === 11 ? 0 : new Date().getMonth() + 1;
const nextMonthYear =
	new Date().getMonth() === 11
		? new Date().getFullYear() + 1
		: new Date().getFullYear();

export const firstDayOfNextMonth = new Date( nextMonthYear, nextMonth, 1 );
export const fourthDayOfNextMonth = new Date( nextMonthYear, nextMonth, 4 );
