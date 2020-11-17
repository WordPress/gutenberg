/**
 * Internal dependencies
 */
import {
	__experimentalGetSettings,
	date as dateNoI18n,
	dateI18n,
	getDate,
	gmdate,
	gmdateI18n,
	isInTheFuture,
	setSettings,
} from '../';

describe( 'isInTheFuture', () => {
	it( 'should return true if the date is in the future', () => {
		// Create a Date object 1 minute in the future.
		const date = new Date( Number( getDate() ) + 1000 * 60 );

		expect( isInTheFuture( date ) ).toBe( true );
	} );

	it( 'should return false if the date is in the past', () => {
		// Create a Date object 1 minute in the past.
		const date = new Date( Number( getDate() ) - 1000 * 60 );

		expect( isInTheFuture( date ) ).toBe( false );
	} );

	it( 'should ignore the timezone', () => {
		const settings = __experimentalGetSettings();

		// Set a timezone in the future
		setSettings( {
			...settings,
			timezone: { offset: '4', string: '' },
		} );
		// Create a Date object 1 minute in the past.
		let date = new Date( Number( getDate() ) - 1000 * 60 );
		expect( isInTheFuture( date ) ).toBe( false );

		// Create a Date object 1 minute in the future.
		date = new Date( Number( getDate() ) + 1000 * 60 );
		expect( isInTheFuture( date ) ).toBe( true );

		// Restore default settings
		setSettings( settings );
	} );
} );

describe( 'Function date', () => {
	it( 'should format date in English, ignoring locale settings', () => {
		const settings = __experimentalGetSettings();

		// Simulate different locale
		const l10n = settings.l10n;
		setSettings( {
			...settings,
			l10n: {
				...l10n,
				locale: 'es',
				months: l10n.months.map( ( month ) => `es_${ month }` ),
				monthsShort: l10n.monthsShort.map(
					( month ) => `es_${ month }`
				),
				weekdays: l10n.weekdays.map( ( weekday ) => `es_${ weekday }` ),
				weekdaysShort: l10n.weekdaysShort.map(
					( weekday ) => `es_${ weekday }`
				),
			},
		} );

		// Check
		const formattedDate = dateNoI18n(
			'F M l D',
			'2019-06-18T11:00:00.000Z'
		);
		expect( formattedDate ).toBe( 'June Jun Tuesday Tue' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s timezone, if no timezone was provided and there’s a site timezone set', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const winterFormattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-01-18T11:00:00.000Z'
		);
		expect( winterFormattedDate ).toBe( '2019-01-18 06:00' );

		const summerFormattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z'
		);
		expect( summerFormattedDate ).toBe( '2019-06-18 07:00' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s UTC offset setting, if no timezone was provided and there isn’t a timezone set in the site', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: '' },
		} );

		// Check
		const winterFormattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-01-18T11:00:00.000Z'
		);
		expect( winterFormattedDate ).toBe( '2019-01-18 07:00' );

		const summerFormattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z'
		);
		expect( summerFormattedDate ).toBe( '2019-06-18 07:00' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given timezone, if said timezone is valid', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			'Asia/Macau'
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given UTC offset, if given timezone is actually a UTC offset', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		let formattedDate;
		formattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			'+08:00'
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		formattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			8
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		formattedDate = dateNoI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			480
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		// Restore default settings
		setSettings( settings );
	} );
} );

// Custom formatting  token functions, in order to support PHP formatting tokens
describe( 'PHP Format Tokens', () => {
	it( 'should support "d" to obtain day of the month, 2 digits with leading zeroes', () => {
		const formattedDate = dateNoI18n( 'd', '2019-06-06T11:00:00.000Z' );

		expect( formattedDate ).toBe( '06' );
	} );

	it( 'should support "D" to obtain textual representation of a day, three letters', () => {
		const formattedDate = dateNoI18n( 'D', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( 'Tue' );
	} );

	it( 'should support "j" to obtain day of the month without leading zeroes', () => {
		const formattedDate = dateNoI18n( 'j', '2019-06-06T11:00:00.000Z' );

		expect( formattedDate ).toBe( '6' );
	} );

	it( 'should support "l" to obtain full textual representation of the day of the week', () => {
		const formattedDate = dateNoI18n( 'l', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( 'Tuesday' );
	} );

	it( 'should support "N" to obtain ISO-8601 numeric representation of the day of the week', () => {
		const formattedDate = dateNoI18n( 'N', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( '2' ); // 2 === Tuesday
	} );

	it( 'should support "S" to obtain ordinal suffix of day of the month', () => {
		const formattedDate = dateNoI18n( 'S', '2019-06-18T11:00:00.000Z' );

		// th for 18th
		expect( formattedDate ).toBe( 'th' );
	} );

	it( 'should support "w" to obtain day of the week starting from 0', () => {
		const formattedDate = dateNoI18n( 'w', '2020-01-01T12:00:00.000Z' ); // Wednesday Jan 1st, 2020

		expect( formattedDate ).toBe( '2' );
	} );

	it( 'should support "z" to obtain zero-indexed day of the year', () => {
		const formattedDate = dateNoI18n( 'z', '2019-01-01' );

		expect( formattedDate ).toBe( '0' );
	} );

	it( 'should support "W" to obtain ISO-8601 week number of year, weeks starting on Monday', () => {
		const formattedDate = dateNoI18n( 'W', '2019-01-06T11:00:00.000Z' );

		expect( formattedDate ).toBe( '01' );
	} );

	it( 'should support "F" to obtain a full textual representation of a month', () => {
		const formattedDate = dateNoI18n( 'F', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( 'June' );
	} );

	it( 'should support "m" to obtain the numeric representation of a month, with leading zeroes', () => {
		const formattedDate = dateNoI18n( 'm', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( '06' );
	} );

	it( 'should support "M" to obtain a three letter textual representation of a month', () => {
		const formattedDate = dateNoI18n( 'M', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( 'Jun' );
	} );

	it( 'should "n" to obtain the numeric representation of a month without leading zeroes', () => {
		const formattedDate = dateNoI18n( 'n', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( '6' );
	} );

	it( 'should support "t" to obtain the days in a given month', () => {
		const formattedDate = dateNoI18n( 't', '2019-02' );

		expect( formattedDate ).toBe( '28' );
	} );

	it( 'should support "L" to obtain whether or not the year is a leap year', () => {
		const formattedDate = dateNoI18n( 'L', '2020' );

		expect( formattedDate ).toBe( '1' );
	} );

	it( 'should support "o" to obtain the ISO-8601 week-numbering year. This has the same value as Y, except that if the ISO week number (W) belongs to the previous or next year, that year is used instead.', () => {
		const formattedDate = dateNoI18n( 'o', '2019-01-01T11:00:00.000Z' );
		const formattedDatePreviousYear = dateNoI18n(
			'o',
			'2017-01-01T11:00:00.000Z'
		); // ISO week number belongs to previous year

		expect( formattedDate ).toBe( '2019' );
		expect( formattedDatePreviousYear ).toBe( '2016' );
	} );

	it( 'should support "Y" to obtain a full numeric representation of a year', () => {
		const formattedDate = dateNoI18n( 'Y', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( '2019' );
	} );

	it( 'should support "y" to obtain a two digit representation of a year', () => {
		const formattedDate = dateNoI18n( 'y', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( '19' );
	} );

	it( 'should support "a" to obtain a lowercase ante meridiem and post meridiem', () => {
		const formattedDate = dateNoI18n( 'a', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( 'am' );
	} );

	it( 'should support "A" to obtain uppercase ante meridiem and post meridiem', () => {
		const formattedDate = dateNoI18n( 'A', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( 'AM' );
	} );

	it( 'should support "B" to obtain the time in Swatch Internet Time (.beats)', () => {
		const formattedDate = dateNoI18n( 'B', '2020-10-09T11:00:00.000Z' );

		expect( formattedDate ).toBe( '500' );
	} );

	it( 'should support "g" to obtain the 12-hour format of an hour without leading zeroes', () => {
		const formattedDate = dateNoI18n( 'g', '2019-06-18T14:00:00.000Z' );

		expect( formattedDate ).toBe( '2' );
	} );

	it( 'should support "G" to obtain the 24-hour format of an hour without leading zeroes', () => {
		const formattedDate = dateNoI18n( 'G', '2019-06-18T09:00:00.000Z' );

		expect( formattedDate ).toBe( '9' );
	} );

	it( 'should support "h" 12-hour format of an hour with leading zeroes', () => {
		const formattedDate = dateNoI18n( 'h', '2019-06-18T14:00:00.000Z' );

		expect( formattedDate ).toBe( '02' );
	} );

	it( 'should support "H" 24-hour format of an hour with leading zeroes', () => {
		const formattedDate = dateNoI18n( 'H', '2019-06-18T09:00:00.000Z' );

		expect( formattedDate ).toBe( '09' );
	} );

	it( 'should support "i" to obtain the minutes with leading zeroes', () => {
		const formattedDate = dateNoI18n( 'i', '2019-06-18T11:01:00.000Z' );

		expect( formattedDate ).toBe( '01' );
	} );

	it( 'should support "s" to obtain seconds with leading zeroes', () => {
		const formattedDate = dateNoI18n( 's', '2019-06-18T11:00:04.000Z' );

		expect( formattedDate ).toBe( '04' );
	} );

	/**
	 * This format is not fully compatible with JavaScript out of the box,
	 * as Date doesn't support sub-millisecond precision.
	 */
	it( 'should support "u" to obtain microseconds', () => {
		const formattedDate = dateNoI18n(
			'u',
			'2019-06-18T11:00:00.123456789Z'
		);

		expect( formattedDate ).toBe( '123000' );
	} );

	it( 'should support "v" to obtain milliseconds', () => {
		const formattedDate = dateNoI18n(
			'v',
			'2019-06-18T11:00:00.123456789Z'
		);

		expect( formattedDate ).toBe( '123' );
	} );

	it( 'should support "e" to obtain timezone identifier', () => {
		const settings = __experimentalGetSettings();

		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		const formattedDate = dateNoI18n( 'e', '2020-10-09T11:00:00.000Z' );

		expect( formattedDate ).toBe( 'Eastern Daylight Time' );

		setSettings( settings );
	} );

	it.skip( 'should support "I" to obtain whether or not the timezone is observing DST', () => {
		const formattedFall = dateNoI18n( 'I', '2020-10-09T11:00:00.000Z' );

		expect( formattedFall ).toBe( '1' );

		const formattedWinter = dateNoI18n( 'I', '2020-01-09T11:00:00.000Z' );

		expect( formattedWinter ).toBe( '0' );
	} );

	it( 'should support "O" to obtain difference to Greenwich time (GMT) without colon between hours and minutes', () => {
		const settings = __experimentalGetSettings();

		setSettings( {
			...settings,
			timezone: { offset: -6 },
		} );

		const formattedDate = dateNoI18n( 'O', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( '-0600' );

		setSettings( settings );
	} );

	it( 'should support "P" to obtain difference to Greenwich time (GMT) without colon between hours and minutes', () => {
		const settings = __experimentalGetSettings();

		setSettings( {
			...settings,
			timezone: { offset: -6 },
		} );

		const formattedDate = dateNoI18n( 'P', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( '-06:00' );

		setSettings( settings );
	} );

	it( 'should support "T" to obtain the timezone abbreviation for the given date', () => {
		const settings = __experimentalGetSettings();

		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		const formattedDateStandard = dateNoI18n(
			'T',
			'2020-01-01T11:00:00.000Z'
		);

		expect( formattedDateStandard ).toBe( 'EST' );

		setSettings( settings );
	} );

	it.skip( 'should support "Z" to obtain timezone offset in seconds', () => {
		const settings = __experimentalGetSettings();

		setSettings( {
			...settings,
			timezone: { offset: -1 },
		} );

		const formattedDate = dateNoI18n( 'Z', '2020-10-09T11:00:00.000Z' );

		expect( formattedDate ).toBe( '3600' );

		setSettings( settings );
	} );

	it( 'should support "c" to obtain ISO 8601 date', () => {
		const settings = __experimentalGetSettings();

		setSettings( {
			...settings,
			timezone: { offset: -5, string: 'America/Bogota' },
		} );

		const formattedDate = dateNoI18n( 'c', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( '2019-06-18T11:00:00-05:00' );

		setSettings( settings );
	} );

	it( 'should support "r" RFC 2822 formatted date', () => {
		const settings = __experimentalGetSettings();

		setSettings( {
			...settings,
			timezone: { offset: -5, string: 'America/Bogota' },
		} );

		const formattedDate = dateNoI18n( 'r', '2019-06-18T11:00:00.000Z' );

		expect( formattedDate ).toBe( 'Tue, 18 Jun 2019 11:00:00 -0500' );

		setSettings( settings );
	} );

	it( 'should support "U" to get epoc for given date', () => {
		const settings = __experimentalGetSettings();

		setSettings( {
			...settings,
			timezone: { string: 'UTC' },
		} );

		const formattedDate = dateNoI18n( 'U', '2020-10-09T11:00:00.000Z' );

		expect( formattedDate ).toBe( '1602241200' );

		setSettings( settings );
	} );
} );

describe( 'Function gmdate', () => {
	it( 'should format date in English, ignoring locale settings', () => {
		const settings = __experimentalGetSettings();

		// Simulate different locale
		const l10n = settings.l10n;
		setSettings( {
			...settings,
			l10n: {
				...l10n,
				locale: 'es',
				months: l10n.months.map( ( month ) => `es_${ month }` ),
				monthsShort: l10n.monthsShort.map(
					( month ) => `es_${ month }`
				),
				weekdays: l10n.weekdays.map( ( weekday ) => `es_${ weekday }` ),
				weekdaysShort: l10n.weekdaysShort.map(
					( weekday ) => `es_${ weekday }`
				),
			},
		} );

		// Check
		const formattedDate = gmdate( 'F M l D', '2019-06-18T11:00:00.000Z' );
		expect( formattedDate ).toBe( 'June Jun Tuesday Tue' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a UTC date', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = gmdate( 'Y-m-d H:i', '2019-06-18T11:00:00.000Z' );
		expect( formattedDate ).toBe( '2019-06-18 11:00' );

		// Restore default settings
		setSettings( settings );
	} );
} );

describe( 'Function dateI18n', () => {
	it( 'should format date using locale settings', () => {
		const settings = __experimentalGetSettings();

		// Simulate different locale
		const l10n = settings.l10n;
		setSettings( {
			...settings,
			l10n: {
				...l10n,
				locale: 'es',
				months: l10n.months.map( ( month ) => `es_${ month }` ),
				monthsShort: l10n.monthsShort.map(
					( month ) => `es_${ month }`
				),
				weekdays: l10n.weekdays.map( ( weekday ) => `es_${ weekday }` ),
				weekdaysShort: l10n.weekdaysShort.map(
					( weekday ) => `es_${ weekday }`
				),
			},
		} );

		// Check
		const formattedDate = dateI18n(
			'F M l D',
			'2019-06-18T11:00:00.000Z',
			true
		);
		expect( formattedDate ).toBe( 'es_June es_Jun es_Tuesday es_Tue' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s timezone, if no timezone was provided and there’s a site timezone set', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const winterFormattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-01-18T11:00:00.000Z'
		);
		expect( winterFormattedDate ).toBe( '2019-01-18 06:00' );

		const summerFormattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z'
		);
		expect( summerFormattedDate ).toBe( '2019-06-18 07:00' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s UTC offset setting, if no timezone was provided and there isn’t a timezone set in the site', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: '' },
		} );

		// Check
		const winterFormattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-01-18T11:00:00.000Z'
		);
		expect( winterFormattedDate ).toBe( '2019-01-18 07:00' );

		const summerFormattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z'
		);
		expect( summerFormattedDate ).toBe( '2019-06-18 07:00' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given timezone, if said timezone is valid', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			'Asia/Macau'
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses the given UTC offset, if given timezone is actually a UTC offset', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		let formattedDate;
		formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			'+08:00'
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		formattedDate = dateI18n( 'Y-m-d H:i', '2019-06-18T11:00:00.000Z', 8 );
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			480
		);
		expect( formattedDate ).toBe( '2019-06-18 19:00' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a UTC date if `gmt` is set to `true`', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			true
		);
		expect( formattedDate ).toBe( '2019-06-18 11:00' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a date that uses site’s timezone if `gmt` is set to `false`', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = dateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z',
			false
		);
		expect( formattedDate ).toBe( '2019-06-18 07:00' );

		// Restore default settings
		setSettings( settings );
	} );
} );

describe( 'Function gmdateI18n', () => {
	it( 'should format date using locale settings', () => {
		const settings = __experimentalGetSettings();

		// Simulate different locale
		const l10n = settings.l10n;
		setSettings( {
			...settings,
			l10n: {
				...l10n,
				locale: 'es',
				months: l10n.months.map( ( month ) => `es_${ month }` ),
				monthsShort: l10n.monthsShort.map(
					( month ) => `es_${ month }`
				),
				weekdays: l10n.weekdays.map( ( weekday ) => `es_${ weekday }` ),
				weekdaysShort: l10n.weekdaysShort.map(
					( weekday ) => `es_${ weekday }`
				),
			},
		} );

		// Check
		const formattedDate = gmdateI18n(
			'F M l D',
			'2019-06-18T11:00:00.000Z'
		);
		expect( formattedDate ).toBe( 'es_June es_Jun es_Tuesday es_Tue' );

		// Restore default settings
		setSettings( settings );
	} );

	it( 'should format date into a UTC date', () => {
		const settings = __experimentalGetSettings();

		// Simulate different timezone
		setSettings( {
			...settings,
			timezone: { offset: -4, string: 'America/New_York' },
		} );

		// Check
		const formattedDate = gmdateI18n(
			'Y-m-d H:i',
			'2019-06-18T11:00:00.000Z'
		);
		expect( formattedDate ).toBe( '2019-06-18 11:00' );

		// Restore default settings
		setSettings( settings );
	} );
} );

describe( 'Moment.js Localization', () => {
	it( 'should change the relative time strings', () => {
		const settings = __experimentalGetSettings();

		// Change the locale strings for tests.
		setSettings( {
			...settings,
			l10n: {
				...settings.l10n,
				relative: {
					...settings.l10n.relative,
					mm: '%d localized minutes',
					hh: '%d localized hours',
				},
			},
		} );

		// Get the freshly changed setings.
		const newSettings = __experimentalGetSettings();

		// Test the unchanged values.
		expect( newSettings.l10n.locale ).toBe( settings.l10n.locale );

		// Test the changed values.
		expect( newSettings.l10n.relative.mm ).toBe( '%d localized minutes' );
		expect( newSettings.l10n.relative.hh ).toBe( '%d localized hours' );

		// Restore default settings
		setSettings( settings );
	} );
} );
